# Take home assignment

## Folder Structure
- client: Contains the frontend code in ReactJS
- server: Contains the backend code in expressJS
- publisher: A service that listens to drive activity changes on files

## How to run
Dependencies
- npm

Make the front end build
```
cd client
npm i
npm run build
```

.env file structure under server
```
export CLIENT_ID=
export CLIENT_SECRET=
export REDIRECT_URI=
export SESSION_KEY=
```
Start the server
```
cd server
npm i
npm start
```
start the publisher
```
cd publisher
npm i
node publisher.js
```

## Basic design
- The main component in the front end responsible for displaying the files is `fileList`. It contains the code for parsing the file list data from backend and rendering the needed view
-  `express-session` is being used to store session information and certain middlewares are used to resolve user details and renew token
 - The notification bell icon displays notification of any file changes of files
 - The `publisher.js` service polls the drive activities api and fetches the updates which it pushes to a redis channel maintained for that user
- When a user connects to `/notifiations` websocket endpoint, the server checks for any messages in the user specific channel in redis, and forwards notifications 