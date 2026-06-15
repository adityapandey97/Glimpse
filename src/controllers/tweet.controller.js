import mongoose, { isValidObjectId } from "mongoose"
import Tweet from "../models/tweet.models.js"
// Modified by Antigravity: imported Like model for tweet deletion cascading cleanup
import Like from "../models/like.models.js"
// import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const{content} =req.body

    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        content,
        // here the bug fixed by copilot and the bug is tweet created without owner field. Explanation: Tweets need to be associated with the user who created them.
        owner: req.user._id
    })
    if(!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            tweet, 
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
   const {userId} = req.params
   if(!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id")
   }
   const tweets = await Tweet.find({owner: userId})
   // Modified by Antigravity: return 200 with empty list instead of throwing 404 to avoid client crashes
   if(!tweets || tweets.length === 0) {
    return res
     .status(200)
     .json(
         new ApiResponse(
             200, 
             [], 