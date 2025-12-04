const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') }); // if .env is project root

const appConfig = {
    port: process.env.PORT ,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoURI:
    process.env.MONGODB_URI ,

    resfreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    corsOrigin: process.env.CORS_ORIGIN
}

module.exports = appConfig;