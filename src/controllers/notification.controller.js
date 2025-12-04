const mongoose = require("mongoose");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

//@Desc:  Get user notifications with pagination and filtering
//@route: GET /api/v1/notifications?page=1&limit=10&unreadOnly=false
//Access:Private
const getUserNotifications = asyncHandler(async (req, res) => {
  // Extract query parameters with default values
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  // Build the base match stage for MongoDB aggregation
  const matchStage = {
    recipient: new mongoose.Types.ObjectId(req.user._id),
  };
  // Add read status filter if unreadOnly is true
  if (unreadOnly === "true") {
    matchStage.read = false;
  }
  // Execute aggregation pipeline to get notifications
  const notifications = await Notification.aggregate([
    // Stage 1: Filter notifications by recipient and read status
    {
      $match: matchStage,
    },
    // Stage 2: Join with users collection to get sender details
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
        pipeline: [
          // Select specific fields from sender
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // Stage 3: Convert sender array to single object
    {
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
    // Stage 4: Sort notifications by creation date
    {
      $sort: { createdAt: -1 },
    },
    // Stage 5: Skip previous pages for pagination
    {
      $skip: (Number(page) - 1) * Number(limit),
    },
    // Stage 6: Limit results per page
    {
      $limit: Number(limit),
    },
  ]);
  // Get count of unread notifications for badge/counter
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  // Get total count of all notifications for pagination
  const totalCount = await Notification.countDocuments({
    recipient: req.user._id,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
        totalCount,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
      "Notifications fetched successfully"
    )
  );
});

//@Desc: Mark a single notification as read
//@route: PATCH /api/v1/notifications/:notificationId/read
//Access:Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  if (!notificationId) {
    throw new ApiError(400, "Notification ID is required");
  }
  const notification = await Notification.findByIdAndUpdate(
    {
      _id: notificationId,
      recipient: req.user._id,
    },
    {
      $set: { read: true },
    },
    { new: true }
  );
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

//@Desc: Mark all user's notifications as read
//@route: PATCH /api/v1/notifications/mark-all-read
//Access:Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      recipient: req.user._id,
      read: false,
    },
    {
      $set: { read: false },
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

//@Desc: Delete a specific notification
//@route: DELETE /api/v1/notifications/:notificationId
//Access:Private
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  if (!notificationId) {
    throw new ApiError(400, "Notification is required");
  }
  const notification = await Notification.findByIdAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

//Internal utility function to create a new notification

const createNotification = async (recipientId, senderId, type, content) => {
  try {
    // Check if recipient has enabled notifications for this type
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return null;
    }
    //Check notification settings
    if (
      (type === "SUBSCRIPTION" &&
        recipient.notificationSettings?.subscriptionActivity === false) ||
      ((type === "COMMENT" || type === "REPLY") &&
        recipient.notificationSettings.commentActivity == false)
    ) {
      // Notifications for this type are disabled by the user
      return null;
    }

    //Create notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      content,
    });
    return notification;
  } catch (error) {
    console.log("Error creating  notification");

    return null;
  }
};

module.exports = {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
};
