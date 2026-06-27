import mongoose from "mongoose";
import Message from "../models/message.models.js";
import Subscription from "../models/subscription.models.js";
import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinaryupload } from "../utils/cloudinary.js";
import fs from "fs";

// Send message (handles text, image, and video attachments)
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, text } = req.body;

    if (!receiverId) {
        throw new ApiError(400, "Receiver ID is required");
    }

    if (!mongoose.isValidObjectId(receiverId)) {
        throw new ApiError(400, "Invalid receiver ID");
    }

    // Check if receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
        throw new ApiError(404, "Receiver not found");
    }

    let imageUrl = "";
    let videoUrl = "";

    // Handle files upload to Cloudinary if they exist in request files
    if (req.files) {
        const imageLocalPath = req.files?.image?.[0]?.path;
        const videoLocalPath = req.files?.video?.[0]?.path;

        if (imageLocalPath) {
            const uploadedImage = await cloudinaryupload(imageLocalPath);
            if (uploadedImage) {
                imageUrl = uploadedImage.url;
            }
        }

        if (videoLocalPath) {
            const uploadedVideo = await cloudinaryupload(videoLocalPath);
            if (uploadedVideo) {
                videoUrl = uploadedVideo.url;
            }
        }
    }

    // Validate that we have at least text or one of the files
    if (!text && !imageUrl && !videoUrl) {
        throw new ApiError(400, "Cannot send an empty message. Please provide text, an image, or a video.");
    }

    const message = await Message.create({
        sender: req.user._id,
        receiver: receiverId,
        text: text || "",
        image: imageUrl,
        video: videoUrl
    });

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", "username avatar fullName")
        .populate("receiver", "username avatar fullName");

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message sent successfully")
    );
});

// Get historical chat messages between two users
const getChatMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid or missing user ID");
    }

    const messages = await Message.find({
        $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id }
        ]
    })
    .sort({ createdAt: 1 })
    .populate("sender", "username avatar fullName")
    .populate("receiver", "username avatar fullName");

    return res.status(200).json(
        new ApiResponse(200, messages, "Chat history retrieved successfully")
    );
});

// Get chat connections (people the user follows or who follow the user)
const getChatConnections = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find subscriptions where user is channel (so followers)
    const followers = await Subscription.find({ channel: userId }).select("subscriber");
    
    // Find subscriptions where user is subscriber (so channels user follows)
    const following = await Subscription.find({ subscriber: userId }).select("channel");

    // Extract user IDs and merge them
    const connectionIds = new Set();
    
    followers.forEach(sub => {
        if (sub.subscriber) connectionIds.add(sub.subscriber.toString());
    });
    
    following.forEach(sub => {
        if (sub.channel) connectionIds.add(sub.channel.toString());
    });

    // Remove self if present
    connectionIds.delete(userId.toString());

    // Fetch details of all unique connection users
    const connections = await User.find({
        _id: { $in: Array.from(connectionIds) }
    }).select("username avatar fullName");

    return res.status(200).json(
        new ApiResponse(200, connections, "Chat connections retrieved successfully")
    );
});

export {
    sendMessage,
    getChatMessages,
    getChatConnections
};
