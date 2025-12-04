const express = require("express")
const cookieParser = require("cookie-parser")
const { registerUser, loginUser, refreshAccessToken, resetPassword, requestPasswordReset, logoutUser, getCurrentUser, changePassword, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory } = require("../controllers/user.controller")
const { upload } = require("../middlewares/multer.middleware")
const verifyJWT = require("../middlewares/auth.middleware")
const userRouter = express.Router()


//public routes
userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
userRouter.post('/login', loginUser)   
userRouter.post('/refresh-token', refreshAccessToken)   

//password reset routes
userRouter.post('/request-password-reset', requestPasswordReset)
userRouter.post('/reset-password', resetPassword)   

//private routes


//protected routes
userRouter.use(verifyJWT)

userRouter.post('/logout', logoutUser)
userRouter.get('/current-user', getCurrentUser)
userRouter.patch('/change-password', changePassword)
userRouter.patch('/update-account', updateAccountDetails)

//avatar and cover image routes
userRouter.patch('/avatar',upload.single('avatar'), updateAvatar)
userRouter.patch('/cover-image',upload.single('coverImage'), updateCoverImage)

//channel routes
userRouter.post('/c/:username', getUserChannelProfile)
userRouter.post('/history', getWatchHistory)

module.exports = userRouter