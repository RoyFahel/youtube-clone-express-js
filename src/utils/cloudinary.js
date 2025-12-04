const appConfig = require("../config/appConfig");
const cloudinary = require("cloudinary").v2;

//Configure cloudinary
cloudinary.config({
  cloud_name: appConfig.cloudinary.cloudName,
  api_key: appConfig.cloudinary.apiKey,
  api_secret: appConfig.cloudinary.apiSecret,
});

//Upload media to cloudinary
const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.log("Error uploading to cloudinary", error);
    throw new Error("Failed to upload media to cloudinary");
  }
};
//Delete media from cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.log("Error deleting from cloudinary", error);
    throw new Error("Failed to delete media  from cloudinary");
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
