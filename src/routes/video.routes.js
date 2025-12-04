const express = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");
const {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  shareVideo,
} = require("../controllers/video.controller");

const videoRouter = express.Router();

//Public routes
videoRouter.get("/", getAllVideos);

//Share video -  public route that works with or without authentication
videoRouter.get("/:videoId/share", shareVideo);

//Protected routes
videoRouter.use(verifyJWT);
videoRouter.post(
  "/",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);
videoRouter.get("/:videoId", getVideoById);
videoRouter.patch("/:videoId", upload.single("thumbnail"), updateVideo);
videoRouter.delete("/:videoId", deleteVideo);
videoRouter.patch("/toggle-publish/:videoId", togglePublishStatus);

module.exports = videoRouter;
