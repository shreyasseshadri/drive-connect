const { google } = require('googleapis');
const redis = require('redis');
const { OAuth2 } = google.auth;
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const redisClient = redis.createClient();
const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);


const driveActivityClient = google.driveactivity({
    version: 'v2',
});


const checkDriveActivity = async () => {
    try {
        // Scan the Redis cache for all keys with the 'user/' prefix
        if (!redisClient.isOpen)
            await redisClient.connect();
        const keys = await redisClient.keys('users/*');
        console.log(keys);
        // Retrieve the access token for each user key
        await Promise.all(
            keys.map(async (key) => {
                try {
                    const user = key.split('/')[1];
                    const { access_token } = JSON.parse(await redisClient.get(key)).tokens;
                    console.log(access_token);

                    // Set the access token for the user's OAuth2 client
                    oauth2Client.setCredentials({ access_token });

                    // Get the activity for the user's Drive
                    const response = await driveActivityClient.activity.query({
                        requestBody: {
                            filter: 'detail.action_detail_case(@type="MODIFY_MEMBERSHIP")',
                            pageSize: 50
                        },
                        auth: oauth2Client,
                    });
                    console.log(response);
                    changes = changes.concat(response.data.activities);
                    changes.forEach(async (change) => {
                        const action = change.actions[0].detail.action_detail_case;
                        const member = change.actions[0].detail[action].member;
                        const file = change.primaryActionDetail.target.driveItem;

                        const message = `${member.user.displayName} ${action === 'added' ? 'added' : 'removed'} from file ${file.title}`;
                        await redisClient.publish(
                            `drive_activity:${user}`,
                            message);
                    });

                } catch (error) {
                    console.error(error);
                }
            })
        );
    } catch (error) {
        console.error(error);
    }
};

const interval = 5 * 1000; // 30 seconds in milliseconds

// Periodically check the Drive activity of all users every 30 seconds
setInterval(checkDriveActivity, interval);