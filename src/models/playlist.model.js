const mongoose = require("mongoose");

//schema
const playlistSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "playlist is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

//compile model
const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = Playlist;
