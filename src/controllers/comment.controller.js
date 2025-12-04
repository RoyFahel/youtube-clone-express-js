const mongoose = require("mongoose");
const Like = require("../models/like.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");
const { createNotification } = require("./notification.controller");

//!@Desc:  Get all comments for a video with pagination and replies
//@route  GET /api/v1/videos/:videoId/comments
//@access Public
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parentComment: null,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
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
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "parentComment",
        as: "replies",
        pipeline: [
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
    {
      $addFields: {
        owner: { $first: "$owner" },
        repliesCount: { $size: "$replies" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);
  // Get total comments count
  const totalComments = await Comment.countDocuments({
    video: videoId,
    parentComment: null,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        totalComments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / parseInt(limit)),
      },
      "Comments fetched successfully"
    )
  );
});

//@Desc:  Add a new comment or reply to a video
//@route  POST /api/v1/videos/:videoId/comments
//@access Private
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content, parentCommentId } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!content || content.trim() == "") {
    throw new ApiError(400, "Comment content is required");
  }
  //Create comment object
  const commentData = {
    content,
    video: videoId,
    owner: req.user._id,
  };
  // Add parent comment reference if provided
  if (parentCommentId) {
    // Check if parent comment exists
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new ApiError(404, "parent comment not found");
    }
    commentData.parentComment = parentCommentId;
  }

  //Create comment
  const comment = await Comment.create(commentData);
  //Get populated comment
  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "username fullName avatar"
  );
  //Send notifications
  if (parentCommentId) {
    // Reply notification - notify the comment owner
    const parentComment = await Comment.findById(parentCommentId);
    if (
      parentComment &&
      parentComment.owner.toString() !== req.user._id.toString()
    ) {
      await createNotification(
        parentComment.owner,
        req.user._id,
        "REPLY",
        `${req.user.fullName} replied to your comment`
      );
    }
  } else {
    // New comment notification - notify the video owner
    const video = await Video.findById(videoId);
    if (video && video.owner.toString() !== req.user._id.toString()) {
      await createNotification(
        video.owner,
        req.user._id,
        "COMMENT",
        `${req.user.fullName} commented on your video`
      );
    }
  }
  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

//@Desc:   Update an existing comment
//@route   PATCH /api/v1/comments/:commentId
//@access  Private
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }
  // Check if comment exists and belongs to user
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(404, "Comment not found or you don't have permission");
  }
  //Update the comment
  comment.content = content;
  await comment.save();
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

//@Desc:    Delete a comment and all its replies
//@route     DELETE  /api/v1/comments/:commentId
//@access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  // Check if comment exists and belongs to user
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(404, "Comment not found or you don't have permission");
  }
  // Delete comment and all replies
  await Promise.all([
    Comment.deleteMany({ parentComment: commentId }),
    Comment.findByIdAndDelete(commentId),
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

//!@Desc:  Get all replies for a specific comment with pagination
//@route   GET /api/v1/comments/:commentId/replies
//@access  Public
const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }

  const replies = await Comment.aggregate([
    {
      $match: {
        parentComment: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_d",
        as: "owner",
        pipeline: [
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
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: { created: -1 },
    },
    {
      $skip: (Number(page) - 1) * Number(limit),
    },
    {
      $limit: Number(limit),
    },
  ]);
  //Get total replies count
  const totalReplies = await Comment.countDocuments({
    parentComment: commentId,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        replies,
        totalReplies,
        currentPage: Number(page),
        totalPages: Math.ceil(totalReplies / Number(limit)),
      },
      "Comment replies fetched successfully"
    )
  );
});

module.exports = {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentReplies,
};
