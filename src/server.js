const path = require('path');
// load .env from project root (one-time at top)
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

// connect DB (make sure connectDB reads process.env.MONGO_URI inside its function)
connectDB();

// middlewares
app.use(express.json());
app.use(cookieParser());

// simple root route (put BEFORE notFound)
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is running', version: 'v1' });
});

// routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/channels', channelRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/playlists', playlistRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likesRouter);

// error handlers (notFound must come after all routes)
app.use(notFound);
app.use(errorHandler);

// normalize and validate port
function normalizePort(val) {
  if (typeof val === 'string') val = val.trim();
  if (val === '' || val == null) return 5000;       // fallback
  const num = parseInt(val, 10);
  if (isNaN(num)) return 5000;                      // fallback
  if (num >= 0 && num <= 65535) return num;
  console.error('Invalid PORT value:', JSON.stringify(process.env.PORT));
  process.exit(1);
}

const PORT = normalizePort(process.env.PORT || '5000');

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
