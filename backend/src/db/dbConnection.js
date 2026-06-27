import mongoose from "mongoose";
import { DB_name } from "../constants.js";
const connectDB = async () => {
    try {
        // Modified by Antigravity: Disable buffering so that queries fail fast instead of hanging when database is offline
        mongoose.set('bufferCommands', false);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`);
        console.log(`\nMongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Database connection failed: ", error);
        // Modified by Antigravity: Throw error instead of process.exit(1) to support fallback startup
        throw error;
    }
}
export default connectDB;