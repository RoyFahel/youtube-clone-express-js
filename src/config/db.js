const mongoose = require("mongoose")
const appConfig = require("./appConfig")

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(appConfig.mongoURI)
        console.log(`mongodb connected `);
        
    } catch (error) {
        console.log(`error connecting to mongodb: ${error.message}`);
        process.exit(1)
    }
}

module.exports = connectDB;