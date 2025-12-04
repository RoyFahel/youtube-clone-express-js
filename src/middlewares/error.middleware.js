const appConfig = require("../config/appConfig");
const ApiError = require("../utils/ApiError");

//error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = err;
    if(!(error instanceof ApiError)){
        const statusCode  =error.statusCode || error.status || 500
        const message = error.message || "Something went wrong"
        error = new ApiError(statusCode, message, error?.errors || [], err.stack)
    }
    //final response
    const response = {
        sucess: false,
        message: error?.message,
        errors: error?.errors,
        stack: appConfig.nodeEnv !== "production" ? error.stack : undefined
    }
    //send repsonse
    return res.status(error.statusCode).json(response)
}

//notfound middleware
const notFound = (req, res, next) => {
    const error = new ApiError(404, `not found - ${req.originalUrl}`)
    next(error)
}

module.exports = {
    errorHandler,
    notFound,
}