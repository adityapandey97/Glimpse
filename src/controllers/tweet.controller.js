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
             "No tweets found for this user"
         )
     )
   }
   return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            tweets, 
            "Tweets fetched successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    // here the bug fixed by copilot and the bug is no authorization check on update/delete. Explanation: Users could update/delete tweets they don't own.
    const tweet = await Tweet.findById(tweetId)
    // Modified by Antigravity: added verification that the tweet exists before checking owner property
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if(tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )
    if(!updatedTweet) {
        throw new ApiError(500, "Failed to update tweet")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(