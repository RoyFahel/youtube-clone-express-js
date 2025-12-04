const path = require('path');
// Load .env from project root (one-time at top)
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const userRouter = require('./routes/user.routes');
const channelRouter = require('./routes/channel.routes');
const videoRouter = require('./routes/video.routes');
const notificationRouter = require('./routes/notification.routes');
const playlistRouter = require('./routes/playlist.routes');
const commentRouter = require('./routes/comment.routes');
const likesRouter = require('./routes/like.routes');

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// ------------------
// Root route (must be before notFound)
app.get('/', (req, res) => {
  res.send(`
    <h1>✅ API is running</h1>
    <p>Version: v1</p>
    <p>Welcome to the YouTube Clone API!</p>
  `);
});

// ------------------
// API routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/channels', channelRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/playlists', playlistRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likesRouter);

// ------------------
// Error handlers
app.use(notFound);
app.use(errorHandler);

// ------------------
// Normalize and validate port
// function normalizePort(val) {
//   if (!val || typeof val !== 'string') return 8080;
//   const port = parseInt(val, 10);
//   if (isNaN(port) || port < 0 || port > 65535) return 8080;
//   return port;
// }

// // Use port provided by EB or fallback to 5000
// const PORT = normalizePort(process.env.PORT);

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});




