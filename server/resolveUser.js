const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const { createClient } = require('redis');

const auth = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

const attachUserInfo = async (req, res, next) => {
    const { tokens } = req.session;

    if (!tokens) return next();

    try {
        const redisClient = createClient();
        auth.setCredentials(tokens);

        const people = google.people({ version: 'v1', auth: auth });

        const userInfo = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names',
        });

        req.user = userInfo.data; // Attach user details to request
        await redisClient.connect();
        await redisClient.set('users/'+req.user.resourceName,JSON.stringify(req.session));
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = attachUserInfo;
