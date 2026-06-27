import mongoose, { isValidObjectId } from "mongoose"
import Comment from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
// Get comments of a specific video

// req.params → get videoId from URL
// req.query → get pagination (page, limit)

// isValidObjectId() → validate MongoDB ID

// Comment.find() → fetch comments of that video
// sort({createdAt:-1}) → latest comments first
// skip() → pagination offset
// limit() → number of comments per page
// populate() → replace owner ObjectId with user details
// lean() → return plain JS object (faster)

// countDocuments() → total comments count
// Math.ceil() → calculate total pages

    // Extract videoId from URL params
    const { videoId } = req.params

    // Extract pagination query params
    const { page = 1, limit = 10 } = req.query

    // Convert page & limit to numbers (important)
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    // Filter comments by videoId
    const filter = { video: videoId }

    // Fetch comments with pagination
    const comments = await Comment.find(filter)
        .sort({ createdAt: -1 }) // latest comments first
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        // Modified by Antigravity: changed field from owner to commentby to match the schema
        .populate("commentby", "fullName avatar username") // comment owner details
        .lean()

    // Count total comments for pagination
    const totalComments = await Comment.countDocuments(filter)

    const totalPages = Math.ceil(totalComments / limitNumber)

    // Send response
    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                totalComments,
                totalPages,
                currentPage: pageNumber,
                pageSize: limitNumber
            }
        }, "Comments fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    // Modified by Antigravity: changed text to content to match comment.models.js schema
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        commentby: req.user._id
    })
    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }
    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    // Modified by Antigravity: changed text to content, and rewrote update logic to correctly check ownership and perform the update
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.commentby.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    comment.content = content;
    const updatedComment = await comment.save();
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(400 , "id is needed")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    // Modified by Antigravity: changed comment.owner to comment.commentby to match schema
    if (comment.commentby.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400 , "comment not found")
    }
    return res.status(200).json(new ApiResponse(200 ,deletedComment , "comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}