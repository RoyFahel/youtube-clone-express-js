const User = require("../models/user.model");
const Video = require("../models/video.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/apiResponse");

const asyncHandler = require("../utils/asyncHandler");
const {
  deleteFromCloudinary,
  uploadToCloudinary,
} = require("../utils/cloudinary");

//@Desc: Get channel profile information
//@route: GET /api/v1/channels/:username
//@Access:Public
const getChannelInfo = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "username is required");
  }
  //get the channel
  const channel = await User.findOne({ username }).select(
    "-password -refreshToken -watchHistory -notificationSettings -email -isVerified"
  );
  if (!channel) {
    throw new ApiError(404, "channel is not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel, "channel fetced successfully"));
});

//@Desc: Update channel profile information and cover image
//@route: PATH /api/v1/channels
//@Access:Private
const updateChannelInfo = asyncHandler(async (req, res) => {
  const { channelDescription, channelTags, socialLinks } = req.body;
  //prepare update object
  const updateData = {};
  if (channelDescription !== undefined) {
    updateData.channelDescription = channelDescription;
  }
  if (channelTags !== undefined) {
    updateData.channelDescription = channelDescription;
    updateData.channelTags = Array.isArray(channelTags);
    channelTags: JSON.parse(channelTags);
  }

  if (socialLinks !== undefined) {
    updateData.socialLinks =
      typeof socialLinks === "object" ? socialLinks : JSON.parse(socialLinks);
  }
  //update cannel cover image if provided
  let coverImageUpdate = {};
  if (req?.files?.coverImage?.[0]?.path) {
    const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
    //delete old cover if existed
    if (req?.user?.coverImage) {
      await deleteFromCloudinary(
        req?.user?.coverImage?.public_id,
        "youtube/images"
      );
    }
    //upload new cover image
    const uploadResult = await uploadToCloudinary(
      coverImageLocalPath,
      "youtube/cover-images"
    );
    if (!uploadResult) {
      throw new ApiError(500, "error uploading cover image");
    }
    coverImageUpdate.coverImage = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };

    
  }
  //merge updates
    const updateObject = {
      ...updateData,
      ...coverImageUpdate,
    };
    //update te user
    const updateUser = await User.findByIdAndUpdate(req.user._id,
      updateObject, {
      new: true,
    }).select("-pasword -refreshToken")
  return res.status(200).json(new ApiResponse(200, updateUser, "channel updated successfully"))
});

//@Desc: Update channel notification preferences
//@route: PATH /api/v1/channels/notifications
//@Access:Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const {emailNotification, subscriptionActivity, commentActivity} = req.body
  //prepare update Object
  const notificationSettings = {}
  if(emailNotification !== undefined){
    notificationSettings["notificationSettings.emailNotification"]
    = emailNotification
  }

  if(subscriptionActivity !== undefined){
    notificationSettings["notificationSettings.subscriptionActivity"]
    = subscriptionActivity
  }

  if(commentActivity !== undefined){
    notificationSettings["notificationSettings.commentActivity"]
    = commentActivity
  }

  if(Object.keys(notificationSettings).length === 0){
    throw new ApiError(400, "no settings provided to update")
  }
  //update te user
  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    $set: notificationSettings,
    
  }, {new: true}
  ).select('notificationSettings')
  if(!updatedUser){
    throw new ApiError(500, "error updating notification settings")
  }
  res.status(200).json(new ApiResponse(200, updatedUser.notificationSettings, "notification settings updated"))
});

//!@Desc: channel videos with pagination and sorting
//@route: GET /api/v1/channels/:username/videos?page=1&limit=10&sortBy=createdAt&sortType=desc
//@Access:Public
const getChannelVideos = asyncHandler(async (req, res) => {});

//@Desc: Generate shareable link for a channel
//@route: GET /api/v1/channels/:username/share
//@Access:Public
const getChannelShareLink = asyncHandler(async (req, res) => {});

const getChannelAnalyticsOverview = asyncHandler(async (req, res) => {});

const getChannelDetailedAnalytics = asyncHandler(async (req, res) => {});

module.exports = {
  getChannelInfo,
  updateChannelInfo,
  updateNotificationSettings,
  getChannelVideos,
  getChannelShareLink,
  getChannelAnalyticsOverview,
  getChannelDetailedAnalytics,
};
