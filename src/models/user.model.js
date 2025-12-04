require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const appConfig = require("../config/appConfig");

//Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    coverImage: {
      public_id: String,
      url: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 character"],
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    //Channel specific fields
    channelDescription: {
      type: String,
      default: "",
    },
    channelTags: {
      type: [String],
      default: [],
    },
    socialLinks: {
      x: String,
      instagram: String,
      facebook: String,
      website: String,
    },
    notificationSettings: {
      emailNotification: {
        type: Boolean,
        default: true,
      },
      subscriptionActivity: {
        type: Boolean,
        default: true,
      },
      commentActivity: {
        type: Boolean,
        default: true,
      },
    },
    //Password reset fields
    refreshPasswordToken: String,
    resetPasswordExpiry: String,
    //  Admin role
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
//Pre-save hook to hash user password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});
//Method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    appConfig.accessTokenSecret,
    {
      expiresIn: appConfig.accessTokenExpiry,
    }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    appConfig.resfreshTokenSecret,
    {
      expiresIn: appConfig.refreshTokenExpiry,
    }
  );
};
//Compile the schema to form a model
const User = mongoose.model("User", userSchema);

module.exports = User;
