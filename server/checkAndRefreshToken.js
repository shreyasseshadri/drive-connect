const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const auth = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const checkAndRefreshToken = async (req, res, next) => {
  try {
    const { tokens } = req.session;

    if (!tokens) {
      return next();
    }

    auth.setCredentials(tokens);

    if (tokens.expiry_date - Date.now() <= 60000) {
      const newTokens = await auth.refreshToken(tokens.refresh_token);
      auth.setCredentials(newTokens);
      req.session.tokens = newTokens; // Request will always have updated token
    }

    next();
  } catch (err) {
    console.error('Error refreshing OAuth token:', err);
    next(err);
  }
};

module.exports = checkAndRefreshToken;