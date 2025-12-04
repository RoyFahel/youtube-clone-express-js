const mongoose = require("mongoose");
const Like = require("../models/like.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Video = require("../models/video.model");

//@Desc: Toggle like/unlike on a video
//@route  POST /api/v1/videos/:videoId/like
//@access Private
const toggleLikeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  //Check if already liked
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  let message;
  if (existingLike) {
    //Unlike
    await Like.findByIdAndDelete(existingLike._id);
    message = "Video unliked successfully ";
    //Update video likes count
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: -1 } });
  } else {
    //Like video
    //Update video likes count
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: 1 } });
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    message = "Video liked successfully";
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});

//@Desc: Toggle like/unlike on a comment
//@route  POST /api/v1/comments/:commentId/like
//@access Private

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  //Check if already liked
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  let message;
  if (existingLike) {
    //Unlike
    await Like.findByIdAndDelete(existingLike._id);
    message = "Comment unliked successfully ";
  } else {
    //Like comment
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    message = "Comment liked successfully";
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});
//@Desc:  Get all Liked videos liked by the authenticated user
//@route   GET /api/v1/video/:videoId
//@access  Private
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $first: "$video" },
      },
    },
    {
      $project: {
        _id: 0,
        video: 1,
        likedAt: "$createdAt",
      },
    },
  ]);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedVideos,
        totalLikedVideos: likedVideos.length,
      },
      "Liked videos fetched successfully"
    )
  );
});

//@Desc:   Get all users who liked a specific video
//@route   GET /api/v1/users/liked-videos
//@access  Private
const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const likes = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
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
        likedBy: { $first: "$likedBy" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likes,
        totalLikes: likes.length,
      },
      "Video likes fetched successfully"
    )
  );
});

//!@Desc:    Get all users who liked a specific comment
//@route   GET /api/v1/comments/:commentId/likes
//@access  Private
const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is required");
  }
  const comments = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
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
        likedBy: { $first: "$likedBy" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        totalComments: comments.length,
      },
      "Video likes fetched successfully"
    )
  );
});
module.exports = {
  toggleCommentLike,
  toggleLikeVideo,
  getLikedVideos,
  getVideoLikes,
  getCommentLikes,
};
