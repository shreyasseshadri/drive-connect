const express = require("express");
const path = require("path");
const app = express();
const publicPath = path.join(__dirname, "..", "client/build");
const { google } = require('googleapis');
const session = require('express-session');
const checkAndRefreshToken = require('./checkAndRefreshToken');
const resolveUser = require('./resolveUser');
const expressWs = require('express-ws');
const redis = require('redis');

expressWs(app);
app.use(express.static(publicPath));


const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.profile',
    , 'https://www.googleapis.com/auth/userinfo.email', "https://www.googleapis.com/auth/drive.activity.readonly"];

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
}));

// Middleware to refresh tokem
app.use(checkAndRefreshToken);
// Middleware to resolve user details from access token
app.use(resolveUser);

app.get('/auth/google', (req, res) => {
    const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    const url = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log(url);
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    const { tokens } = await auth.getToken(req.query.code);
    console.log(req.query);
    console.log(tokens);
    auth.setCredentials(tokens);
    req.session.tokens = tokens;

    res.redirect('/explorer');
});


const resolveFile = async (drive, file) => {
    if (file.permissionIds) {
        const promises = file.permissionIds.map(async (id) => drive.permissions.get({
            fileId: file.id,
            permissionId: id,
            fields: 'id,displayName,emailAddress'
        }).then(res => res.data));

        await Promise.all(promises).then((response) => {
            file.members = response;
        });
    }
    else {
        file.members = file.owners;
    }
    return file;
}

const resolveFiles = (drive, files) => {
    return files.map((file) => resolveFile(drive, file));
}

// Handle WebSocket connections
app.ws('/notifications', async (socket, req) => {
    console.log("recieved ws connection from", req.user.resourceName);
    try {
        // Retrieve the user's unique ID from the attached user object
        const uid = req.user.resourceName;

        // Subscribe to the user's Redis channel
        const channel = `drive_activity:${uid}`;

        redis.subscribe(channel, (err, count) => {
            if (err) console.error(err.message);
            console.log(`Subscribed to ${count} channels.`);
          });

        // Listen for messages on the user's Redis channel
        redis.on('message', (pattern, channel, message) => {
            // Send the message to the user's WebSocket connection
            socket.send(message);
        });
    } catch (error) {
        console.error(error);
    }
});

app.get('/download/:fileId', async (req, res, next) => {
    try {

        const fileId = req.params.fileId;
        const auth = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        auth.setCredentials(req.session.tokens);

        const drive = google.drive({ version: 'v3', auth });

        const file = await drive.files.get({
            fileId: fileId,
            fields: 'name,mimeType,createdTime'
        });

        let fileName = file.data.name;
        let mimeType = file.data.mimeType;
        let downloadUrl;

        if (mimeType.includes('google-apps')) {
            // Export Google Docs, Sheets, and Slides files as binary files
            if (mimeType === 'application/vnd.google-apps.document') {
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                fileName += '.docx';
            } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileName += '.xlsx';
            } else if (mimeType === 'application/vnd.google-apps.presentation') {
                mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                fileName += '.pptx';
            }

            const response = await drive.files.export({
                fileId: fileId,
                mimeType: mimeType,
                auth: auth,
            });

            downloadUrl = response.data;
        } else {
            // Download other file types directly as binary files
            const response = await drive.files.get({
                fileId: fileId,
                alt: 'media',
                auth: auth,
            });

            downloadUrl = response.data;
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(downloadUrl);
    } catch (error) {
        next(error);
    }
});

// API to get list of files
app.get('/fileList', async (req, res) => {
    console.log(req.user);
    console.log("File list api hit!!");
    const auth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    auth.setCredentials(req.session.tokens);

    const drive = google.drive({ version: 'v3', auth });
    const files = await drive.files.list({
        fields: 'nextPageToken, files(id, name, owners(displayName,emailAddress), permissionIds, webContentLink)',
    });

    Promise.all(resolveFiles(drive, files.data.files))
        .then((resolvedFiles) => {
            res.send({ ...files.data, files: resolvedFiles });
        });
});

app.get("/*", function (req, res) {
    res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(process.env.PORT || 7070);