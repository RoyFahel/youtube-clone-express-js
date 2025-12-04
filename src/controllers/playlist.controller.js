const mongoose = require("mongoose");
const Playlist = require("../models/playlist.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

//@Desc: Create a new playlist
//@route: POST /api/v1/playlists
//Access:Private
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic = true } = req.body;
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }
  //Create playlist
  const playlist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user._id,
    isPublic: Boolean(isPublic),
  });
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created"));
});

//@Desc: Add a video to a playlist
//@route: POST /api/v1/playlists/:playlistId/videos/:videoId
//Access: Private
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist and video Id are required");
  }
  // Check if playlist exists and belongs to user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }

  // Check if video is already in playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in the playlist");
  }
  //Add video to playlist
  playlist.videos.push(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist"));
});

//@Desc: Get user's playlists with videos info
//@route: GET /api/v1/users/:userId/playlists
//Access: Public
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userIdToUse = userId || req.user._id;
  if (!userIdToUse) {
    throw new ApiError(400, "User ID is required");
  }
  const isOwner = req.user._id.toString() === userIdToUse.toString();
  // If not the owner, only return public playlists
  const matchCondition = {
    owner: new mongoose.Types.ObjectId(userIdToUse),
    ...(isOwner ? {} : { isPublic: true }),
  };
  const playlists = await Playlist.aggregate([
    {
      $match: matchCondition,
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              videoFile: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videoCount: { $size: "$videos" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

//@Desc: Get detailed information about a specific playlist
//@route: GET /api/v1/playlists/:playlistId
//Access: Public
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              as: "owner",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
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
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        videoCount: { $size: "$videos" },
      },
    },
  ]);

  if (!playlist.length) {
    throw new ApiError(404, "Playlist not found");
  }
  const playlistData = playlist[0];
  // Check if playlist is private and user is not the owner
  if (
    !playlistData.isPublic &&
    (!req.user || playlistData.owner._id.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, "You don't have permission to view this playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlistData, "Playlist fetched successfully"));
});

//@Desc: Remove a video from a playlist
//@route: DELETE /api/v1/playlists/:playlistId/videos/:videoId
//Access: Public
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist ID and Video Id are required");
  }
  // Check if playlist exists and belongs to user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }
  // Check if video is in playlist
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video not found in the playlist");
  }
  // Remove video from playlist
  playlist.videos = playlist.videos.filter(
    (video) => video.toString() !== videoId
  );
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

//@Desc:  Update playlist details (name, description, privacy)
//@route: PATCH /api/v1/playlists/:playlistId
//Access: Private
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description, isPublic } = req.body;
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  if (!name && !description && isPublic === undefined) {
    throw new ApiError(400, "At least one field is required");
  }
  // Check if playlist exists and belongs to user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }
  //Update playlist fields
  if (name) playlist.name = name;
  if (description !== undefined) playlist.description = description;
  if (isPublic !== undefined) playlist.isPublic = isPublic;
  await playlist.save();
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

//@Desc:   Delete a playlist
//@route: delete /api/v1/playlists/:playlistId
//Access: Public
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }
  // Check if playlist exists and belongs to user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }
  //delete
  await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

module.exports = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};
