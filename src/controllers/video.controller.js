import mongoose, { isValidObjectId } from "mongoose"
// here the bug fixed by copilot and the bug is import { Video } from "../models/video.model.js" — wrong path AND named import on default export. Explanation: Wrong import path and syntax caused import error.
import  Video  from "../models/video.models.js"
// Modified by Antigravity: imported related models for video deletion cascading cleanup
import Like from "../models/like.models.js"
import Comment from "../models/comment.models.js"
import Playlist from "../models/playlist.models.js"
// import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import ApiResponse  from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { cloudinaryupload } from "../utils/cloudinary.js"


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
    const { title, description } = req.body
    
    // Modified by Antigravity: Validate title and description fields are present
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description is required");
    }

    // here the bug fixed by copilot and the bug is req.files?.videoFile[0] — field name is videoFile in routes and videoFile may be missing. Explanation: Optional chaining must include the array access.
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }
    // upload files to cloudinary and get the uploaded file urls
    const video = await cloudinaryupload(videoLocalPath);
    const thumbnail = await cloudinaryupload(thumbnailLocalPath);
    if (!video) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }
    // create video in the database
    const createdVideo = await Video.create({
        title,
        description,
        // here the bug fixed by copilot and the bug is saved videoUrl, thumbnailUrl, uploadedBy — model fields are videoFile, thumbnail, owner. Explanation: Field name mismatch caused data to be saved in wrong fields.
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user._id
    })
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while publishing the video");
    }
    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video published successfully")
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId).populate("owner", "fullName avatar username")
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
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
                title,
                description
            }
        },
        { new: true }
    )