const appConfig = require("../config/appConfig");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const JWT = require("jsonwebtoken");
//middleware to authenticate user using JWT
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token;
    token =
      req?.cookies?.accessToken || req?.headers?.authorization?.split(" ")?.[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    //Verify the token
    const decodedToken = JWT.verify(token, appConfig.accessTokenSecret);
    // Get the user from database
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    //Add the user to request object
    req.user = user;
    next();
  } catch (error) {
    // Special handling for logout requests
    if (req.path === "/logout") {
      // Clear cookies even if token is invalid
      const cookieOptions = {
        httpOnly: true,
        sameSite: "strict",
        secure: appConfig.nodeEnv === "production",
        path: "/",
        expires: new Date(0),
      };
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(200).json({
        success: true,
        message: "Logout successfully",
        date: {},
      });
    }

    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

module.exports = verifyJWT;
