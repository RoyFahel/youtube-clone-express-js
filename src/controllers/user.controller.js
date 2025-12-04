const appConfig = require("../config/appConfig");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");

//internal utility function to generate JWT tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

//@Desc:  Register a new user with optional avatar and cover image
//@route: POST /api/v1/users/register
//Access:Public
const registerUser = asyncHandler(async (req, res) => {
  //Get user details from request
  const { username, email, fullName, password } = req.body;
  //validations
  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }
  //Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //Upload avatar if provided
  let avatarLocalPath;
  let avatarUpload = {};
  if (req.files && req.files.avatar && req?.files?.avatar[0]?.path) {
    avatarLocalPath = req.files.avatar[0].path;
    const uploadResult = await uploadToCloudinary(
      avatarLocalPath,
      "youtube/avatars"
    );

    if (!uploadResult) {
      throw new ApiError(500, "Error uploading avatar");
    }
    avatarUpload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  //Upload cover image if provided
  let coverImageLocalPath;
  let coverImageUpload = {};
  if (req.files && req.files.coverImage && req?.files?.coverImage[0]?.path) {
    coverImageLocalPath = req.files.coverImage[0].path;
    const uploadResult = await uploadToCloudinary(
      coverImageLocalPath,
      "youtube/cover-images"
    );

    if (!uploadResult) {
      throw new ApiError(500, "Error uploading cover image");
    }
    coverImageUpload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  //Create the user
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: Object.keys(avatarUpload).length > 0 ? avatarUpload : undefined,
    coverImage:
      Object.keys(coverImageUpload).length > 0 ? coverImageUpload : undefined,
  });

  // Remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new Error("Error registering user");
  }
  //Return the response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

//!@desc - login user and generate token
//@route - POST api/v1/users/login
//@Access - Public

const loginUser = asyncHandler(async (req, res) => {
  // Get credentials from request
  const { email, username, password } = req.body;

  // Validate required fields
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Get user without sensitive fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set cookies
  const cookieOptions = {
    httpOnly: true, //Not accessible to JavaScript
    sameSite: "Strict", //CSRF protection
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

//!@desc - logout user and clear token
//@route - POST api/v1/users/logout
//@Access - Public

const logoutUser = asyncHandler(async (req, res) => {
  //clear refresh token in DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshAccessToken: null },
    },
    { new: true }
  );
  //clear cookie
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: appConfig.nodeEnv === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", cookieOptions)
    .cookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//@Desc:   Refresh access token using refresh token
//@route: POST /api/v1/users/refresh-token
//Access:Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get refresh token from cookies or body
    const incomingRefreshToken =
      req?.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    //Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      appConfig.resfreshTokenSecret
    );
    //Find the user with ths refresh token
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    //Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user?._id);
    //Set cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: appConfig.nodeEnv === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
});

//!@desc - Change password
//@route - POST api/v1/users/change-password
//@Access - Private

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "old password and new password are required");
  }
  //find the user with password
  const user = await User.findById(req.user._id);
  //check if old password is correct
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "invalid old password");
  }
  //update password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//!@desc - get current user's profile
//@route - GET api/v1/users/current
//@Access - Private

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched"));
});

//!@desc - update user's account details
//@route - PATCH api/v1/users/update
//@Access - Private

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "at least one fiels is required");
  }
  //update user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
      },
    },
    { new: true }
  ).select("-passwrod -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

//!@desc - get current user's profile
//@route - PATCH api/v1/users/avatar
//@Access - Private

const updateAvatar = asyncHandler(async (req, res) => {
  //get avatar file
  const avatarLocalPath = req.file.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }
  //get current user
  const user = await User.findById(req.user._id);
  //delete old avatar
  if (user?.avatar?.public_id) {
    await deleteFromCloudinary(user?.avatar?.public_id);
  }
  //upload new avatar
  const uploadResult = await uploadToCloudinary(
    avatarLocalPath,
    "youtube/avatars"
  );
  if (!uploadResult) {
    throw new ApiError(500, "Error uploading avatar");
  }
  //update the avatar
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "avatar updated"))
});

//!@desc - update user's cover image
//@route - PATCH api/v1/users/cover-image
//@Access - Private

const updateCoverImage = asyncHandler(async (req, res) => {
  //get coverImage file
  const coverImageLocalPath = req?.file?.path || req?.files?.coverImage?.[0]?.path;

if (!coverImageLocalPath) {
  throw new ApiError(400, "coverImage file is required");
}

  //get current user
  const user = await User.findById(req.user._id);
  //delete old coverImage
  if (user?.coverImage?.public_id) {
    await deleteFromCloudinary(user?.coverImage?.public_id);
  }
  //upload new coverImage
  const uploadResult = await uploadToCloudinary(
    coverImageLocalPath,
    "youtube/cover-images"
  );
  if (!uploadResult) {
    throw new ApiError(500, "Error uploading coverImage");
  }
  //update the coverImage
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "coverImage updated"))
});

//!@desc - get user's channel profile with subscription details
//@route - GET api/v1/users/cover-image
//@Access - Private

const getUserChannelProfile = asyncHandler(async (req, res) => {});

//!@desc - get user's watch history
//@route - GET api/v1/users/watch-history
//@Access - Private

const getWatchHistory = asyncHandler(async (req, res) => {});

//!@desc - Request password reset email
//@route - POST api/v1/users/request-reset-password
//@Access - Private

const requestPasswordReset = asyncHandler(async (req, res) => {});

//!@desc - reset password using reset token
//@route - POST api/v1/users/request-reset-password/:token
//@Access - Private

const resetPassword = asyncHandler(async (req, res) => {});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  requestPasswordReset,
  resetPassword,
};
