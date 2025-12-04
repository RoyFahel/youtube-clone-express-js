const express = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentReplies,
} = require("../controllers/comment.controller");

const commentRouter = express.Router();

// Get comments for a video
commentRouter.get("/video/:videoId", getVideoComments);

// Get replies for a comment
commentRouter.get("/:commentId/replies", getCommentReplies);

// Add a comment to a video
commentRouter.post("/video/:videoId", verifyJWT, addComment);

//Update and delete comments
commentRouter.patch("/:commentId", verifyJWT, updateComment);
commentRouter.delete("/:commentId", verifyJWT, deleteComment);
module.exports = commentRouter;
