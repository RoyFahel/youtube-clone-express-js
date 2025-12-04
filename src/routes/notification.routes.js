const express = require("express");
const {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const notificationRouter = express.Router();

//Apply auth middleware to all routes
notificationRouter.use(verifyJWT);
//Get user notification
notificationRouter.get("/", getUserNotifications);
//Mark all notifications as read
notificationRouter.patch("/mark-all-read", markAllNotificationsAsRead);

//Mark notification as read
notificationRouter.patch("/:notificationId", markNotificationAsRead);

//Delete a notification
notificationRouter.delete("/:notificationId", deleteNotification);

module.exports = notificationRouter;
