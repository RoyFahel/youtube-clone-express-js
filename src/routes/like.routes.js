const express = require("express");
const {
  toggleCommentLike,
  toggleLikeVideo,
  getLikedVideos,
  getVideoLikes,
  getCommentLikes,
} = require("../controllers/like.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const likesRouter = express.Router();

//Toggle likes
likesRouter.post("/toggle/video/:videoId", verifyJWT, toggleLikeVideo);

likesRouter.post("/toggle/comment/:commentId", verifyJWT, toggleCommentLike);

//Get likes
likesRouter.get("/videos", verifyJWT, getLikedVideos);
likesRouter.get("/videos/:videoId", verifyJWT, getVideoLikes);
likesRouter.get("/comment/:commentId", verifyJWT, getCommentLikes);

module.exports = likesRouter;
