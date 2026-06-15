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