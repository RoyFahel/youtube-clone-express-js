const express = require("express");
const {
  getChannelInfo,
  updateChannelInfo,
  updateNotificationSettings,
  getChannelVideos,
  getChannelShareLink,
  getChannelAnalyticsOverview
} = require("../controllers/channel.controller");

const verifyJWT = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");
// const {
//   getChannelAnalyticsOverview,
//   getChannelDetailedAnalytics,
// } = require("../controllers/channelAnalytics.controller");

const channelRouter = express.Router()

//Public Routes
channelRouter.get("/:username", getChannelInfo);
channelRouter.get("/:username/videos", getChannelVideos);
channelRouter.get("/:username/share", getChannelShareLink);

//Protect Route
channelRouter.use(verifyJWT);

//channel Customization
channelRouter.patch(
  "/update",
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  updateChannelInfo
);
//Notification settings
channelRouter.patch("/notification-settings", updateNotificationSettings);

//Analytic overview
channelRouter.get(
  "/analytics/overview",
  verifyJWT,
  getChannelAnalyticsOverview
);
// channelRouter.get("/analytics/details/:channelId", getChannelDetailedAnalytics);

module.exports = channelRouter;
