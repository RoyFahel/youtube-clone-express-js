const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

//schema
const commentSchema = mongoose.Schema(
  {

    content: {
      type: String,
      required: [true, "comment content is required"],
      trim: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "video is required"],
      ref: "Video",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "video is required"],
      ref: "User",
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
  }
);
// addd the mongoose-aggregate-paginate plugin
commentSchema.plugin(mongooseAggregatePaginate)

//compile model
const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
