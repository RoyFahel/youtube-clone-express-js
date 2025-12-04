const mongoose = require("mongoose");

//schema
const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Types.ObjectId,
      required: [true, "recipient is required"],
      ref: "User"
    },
    sender: {
      type: mongoose.Types.ObjectId,
      required: [true, "sender is required"],
      ref: "User"
    },
    type: {
      type: String,
      required: [true, "notification type is required"],
      enum: ['SUNSCRIPTION', 'COMMENT', 'REPLY', 'VIDEO']
    },
    content: {
      type: String,
      required: [true, "notification content is required"],
    },
    read: {
      type: Boolean,
      default: false,
    },
    
  },
  {
    timestamps: true,
  }
);

//compile model
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
