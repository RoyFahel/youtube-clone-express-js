const path = require('path');

// ------------------
// Load .env
console.log('🔹 Loading .env file...');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
  console.log('✅ .env loaded successfully');
} catch (err) {
  console.error('❌ Failed to load .env:', err);
}

// ------------------
// Require dependencies
console.log('🔹 Loading dependencies...');
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

console.log('✅ Dependencies loaded');

// ------------------
// Initialize app
const app = express();
console.log('🔹 Express app initialized');

// ------------------
// Connect to MongoDB
console.log('🔹 Connecting to MongoDB...');
try {
  connectDB();
  console.log('✅ MongoDB connection initiated');
} catch (err) {
  console.error('❌ MongoDB connection failed:', err);
}

// ------------------
// Middlewares
console.log('🔹 Setting up middlewares...');
app.use(express.json());
app.use(cookieParser());
console.log('✅ Middlewares configured');

// ------------------
// Root route
console.log('🔹 Setting up root route...');
app.get('/', (req, res) => {
  console.log('🌐 Root route accessed');
  res.send(`
    <h1>✅ API is running</h1>
    <p>Version: v1</p>
    <p>Welcome to the YouTube Clone API!</p>
  `);
});

// ------------------
// API routes
console.log('🔹 Registering API routes...');
app.use('/api/v1/users', userRouter);
app.use('/api/v1/channels', channelRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/playlists', playlistRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likesRouter);
console.log('✅ API routes registered');

// ------------------
// Error handlers
console.log('🔹 Setting up error handlers...');
app.use(notFound);
app.use(errorHandler);
console.log('✅ Error handlers set');

// ------------------
// Normalize and validate port
function normalizePort(val) {
  console.log('🔹 Normalizing port...');
  if (!val || typeof val !== 'string') {
    console.log('⚠️ No PORT env found, using default 5000');
    return 5000;
  }
  const port = parseInt(val, 10);
  if (isNaN(port) || port < 0 || port > 65535) {
    console.log('⚠️ Invalid PORT env, using default 5000');
    return 5000;
  }
  console.log(`✅ Port normalized to ${port}`);
  return port;
}

const PORT = normalizePort(process.env.PORT);

// ------------------
// Start the server
console.log(`🔹 Starting server on port ${PORT}...`);
try {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err);
}
