import mongoose, { isValidObjectId } from "mongoose"
import  Video  from "../models/video.models.js"
import Like from "../models/like.models.js"
import Comment from "../models/comment.models.js"
import Playlist from "../models/playlist.models.js"
import User from "../models/user.models.js"
import cleanupLocalFiles from "../utils/cleanup.js"
import { ApiError } from "../utils/ApiError.js"
import ApiResponse  from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { cloudinaryupload, deleteFromCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

/* ================= FETCH ALL VIDEOS =================

asyncHandler → async errors automatically handle karta hai
req.query → URL parameters (page, limit, search, sort, userId)

page → current page number (pagination)
limit → ek page me kitni videos
query → search keyword
sortBy → kis field se sort karna
sortType → asc (1) ya desc (-1)
userId → specific user ki videos filter

filter → MongoDB query object
isPublished: true → sirf public videos

$or → multiple conditions me se koi ek match ho
$regex → partial text search
$options: "i" → case insensitive (Node = node)

isValidObjectId() → MongoDB ID valid hai ya nahi check karta
throw → error stop karke error handler me bhejta

sort() → data ko arrange karta (1 = asc, -1 = desc)
skip() → pagination ke liye starting records ignore
limit() → kitne records return karne hain

populate() → ObjectId ko actual user data se replace karta (MongoDB join jaisa)

countDocuments() → total matching videos count karta
Math.ceil() → total pages calculate karta (round up)

ApiResponse → custom structured JSON response bhejne ke liye
*/
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const filter = { isPublished: true }
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        // Modified by Antigravity: changed filter.uploadedBy to filter.owner to match the schema field
        filter.owner = userId;
    }
    let sortOptions = {}
    if (sortBy && sortType) {   
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    }
    const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit)
    // Modified by Antigravity: changed population field from uploadedBy to owner
    .populate("owner", "fullName avatar username")
    const totalVideos = await Video.countDocuments(filter)
    const totalPages = Math.ceil(totalVideos / limit)
    return res
    .status(200)
    .json(
        new ApiResponse(200, {
            videos,
            pagination: {
                totalVideos,
                totalPages,
                currentPage: page,
                pageSize: limit
            }
        }, "Videos fetched successfully")
    );
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || title.trim() === "") {
            throw new ApiError(400, "Title is required");
        }
        if (!description || description.trim() === "") {
            throw new ApiError(400, "Description is required");
        }

        const videoFileObject = req.files?.videoFile?.[0];
        const videoLocalPath = videoFileObject?.path;
        if (!videoLocalPath) {
            throw new ApiError(400, "Video file is required. Please select a video to upload.");
        }

        // Enforce max video file size BEFORE uploading to Cloudinary (save bandwidth)
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
        if (videoFileObject.size && videoFileObject.size > MAX_VIDEO_SIZE) {
            throw new ApiError(400, `Video file is too large (${(videoFileObject.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 50MB.`);
        }

        const thumbnailFileObject = req.files?.thumbnail?.[0];
        const thumbnailLocalPath = thumbnailFileObject?.path;
        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail image is required. Please select a thumbnail.");
        }

        // Enforce max thumbnail size (5MB)
        const MAX_THUMB_SIZE = 5 * 1024 * 1024;
        if (thumbnailFileObject.size && thumbnailFileObject.size > MAX_THUMB_SIZE) {
            throw new ApiError(400, `Thumbnail image is too large (${(thumbnailFileObject.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 5MB.`);
        }

        // Upload video to Cloudinary
        const video = await cloudinaryupload(videoLocalPath);
        if (!video || !video.url) {
            throw new ApiError(500, "Failed to upload video to cloud storage. Please check your connection and try again.");
        }

        // Upload thumbnail to Cloudinary
        const thumbnail = await cloudinaryupload(thumbnailLocalPath);
        if (!thumbnail || !thumbnail.url) {
            // Clean up the already-uploaded video if thumbnail fails
            if (video.public_id) {
                await deleteFromCloudinary(video.public_id, "video");
            }
            throw new ApiError(500, "Failed to upload thumbnail to cloud storage. Please try again.");
        }

        // Enforce max duration limit of 10 minutes (600 seconds)
        const MAX_DURATION = 600;
        if (video.duration && video.duration > MAX_DURATION) {
            // Clean up both Cloudinary assets since we can't use this video
            if (video.public_id) {
                await deleteFromCloudinary(video.public_id, "video");
            }
            if (thumbnail.public_id) {
                await deleteFromCloudinary(thumbnail.public_id, "image");
            }
            throw new ApiError(400, `Video is too long (${Math.round(video.duration)}s). Maximum allowed duration is ${MAX_DURATION / 60} minutes.`);
        }

        // Create video record in database
        let createdVideo;
        try {
            createdVideo = await Video.create({
                title: title.trim(),
                description: description.trim(),
                videoFile: video.url,
                thumbnail: thumbnail.url,
                duration: video.duration || 0,
                owner: req.user._id
            });
        } catch (dbError) {
            // DB write failed — clean up Cloudinary to avoid orphaned files
            if (video.public_id) await deleteFromCloudinary(video.public_id, "video");
            if (thumbnail.public_id) await deleteFromCloudinary(thumbnail.public_id, "image");
            throw new ApiError(500, "Failed to save video details. Please try again.");
        }

        return res.status(201).json(
            new ApiResponse(201, createdVideo, "Video published successfully!")
        );
    } catch (error) {
        // Cleanup any local temp files on any error
        cleanupLocalFiles(req);
        throw error;
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "fullName avatar username");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
})

// Feature #13: Increment view count and update watch history
const incrementVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Add to watch history if user is authenticated (avoid duplicates, max 50)
    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { watchHistory: videoId },  // Remove if already exists
            },
            { new: false }
        );
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    watchHistory: {
                        $each: [videoId],
                        $position: 0,
                        $slice: 50  // Keep only last 50
                    }
                }
            }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { views: video.views }, "View recorded successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // Guard against invalid ObjectId before querying the DB
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    if (!title && !description) {
        throw new ApiError(400, "At least one field (title or description) is required to update");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updateFields = {};
    if (title && title.trim()) updateFields.title = title.trim();
    if (description && description.trim()) updateFields.description = description.trim();

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );
    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video details. Please try again.");
    }
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Guard against invalid ObjectId before querying the DB
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found or already deleted");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Cascade delete: remove all associated data before deleting the video
    await Like.deleteMany({ video: videoId });
    await Comment.deleteMany({ video: videoId });
    await Playlist.updateMany({}, { $pull: { videos: videoId } });

    // Attempt to remove Cloudinary assets (non-fatal if they fail)
    try {
        if (video.videoFile) {
            const videoPublicId = video.videoFile.split('/').pop()?.split('.')[0];
            if (videoPublicId) await deleteFromCloudinary(videoPublicId, 'video');
        }
        if (video.thumbnail) {
            const thumbPublicId = video.thumbnail.split('/').pop()?.split('.')[0];
            if (thumbPublicId) await deleteFromCloudinary(thumbPublicId, 'image');
        }
    } catch (cloudErr) {
        console.warn('Cloudinary cleanup warning during video delete:', cloudErr.message);
    }

    await Video.findByIdAndDelete(videoId);
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    // here the bug fixed by copilot and the bug is video.uploadedBy — should be video.owner. Explanation: Field name mismatch in ownership check.
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    )
    if (!updatedVideo) {
        throw new ApiError(500, "Failed to toggle publish status");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Publish status toggled successfully"
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    incrementVideoView,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}