import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    /* Modified by Antigravity: Added diagnostic info for database and Cloudinary status */
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "Connected" : dbState === 2 ? "Connecting" : dbState === 3 ? "Disconnecting" : "Disconnected";

    const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    
    // Test Cloudinary connection if configured
    let cloudinaryStatus = "Not Configured";
    if (cloudinaryConfigured) {
        try {
            await cloudinary.api.ping();
            cloudinaryStatus = "Connected";
        } catch (err) {
            cloudinaryStatus = `Failed: ${err.message}`;
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            db: {
                status: dbStatus,
                readyState: dbState,
                uri: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : "Not Configured"
            },
            cloudinary: {
                status: cloudinaryStatus,
                configured: cloudinaryConfigured
            }
        }, "Healthcheck and diagnostics completed successfully")
    );
});

export {
    healthcheck
}