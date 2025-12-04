const mongoose = require("mongoose")

//Schema
const channelAnalyticsSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalView: {
      type: Number,
      default: 0,
    },
    totalScribers: {
      type: Number,
      default: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
    dailyStats: [
      {
        date: { type: Date, require: true },
        views: { type: Number, default: 0 },
        subscribersGained: { type: Number, default: 0 },
        subscribersLost: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);
// Index for faster lookups
channelAnalyticsSchema.index({ channel: 1 });
//Compile the schema to form a model
const ChannelAnalytic = mongoose.model(
  "ChannelAnalytic",
  channelAnalyticsSchema
);

module.exports = ChannelAnalytic;
