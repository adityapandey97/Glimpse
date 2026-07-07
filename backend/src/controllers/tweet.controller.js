import mongoose, { isValidObjectId } from "mongoose"
import Tweet from "../models/tweet.models.js"
// Modified by Antigravity: imported Like model for tweet deletion cascading cleanup
import Like from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Feature: Get all tweets for global community feed (paginated)
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const tweets = await Tweet.find()
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate("owner", "fullName avatar username")
        .lean();

    const tweetsWithLikes = await Promise.all(tweets.map(async (tweet) => {
        const likesCount = await Like.countDocuments({ tweet: tweet._id });
        let isLiked = false;
        if (req.user?._id) {
            isLiked = await Like.exists({ tweet: tweet._id, likedby: req.user._id });
        }
        return {
            ...tweet,
            likesCount,
            isLiked: !!isLiked
        };
    }));

    const totalTweets = await Tweet.countDocuments();
    const totalPages = Math.ceil(totalTweets / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            tweets: tweetsWithLikes,
            pagination: { totalTweets, totalPages, currentPage: pageNumber, pageSize: limitNumber }
        }, "Community tweets fetched successfully")
    );
});
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
       .sort({ createdAt: -1 })
       .populate("owner", "fullName avatar username")
       .lean();

   const tweetsWithLikes = await Promise.all(tweets.map(async (tweet) => {
       const likesCount = await Like.countDocuments({ tweet: tweet._id });
       let isLiked = false;
       if (req.user?._id) {
           isLiked = await Like.exists({ tweet: tweet._id, likedby: req.user._id });
       }
       return {
           ...tweet,
           likesCount,
           isLiked: !!isLiked
       };
   }));

   // Return 200 with empty list instead of throwing 404
   return res.status(200).json(
       new ApiResponse(200, tweetsWithLikes, tweetsWithLikes.length === 0 ? "No tweets found for this user" : "Tweets fetched successfully")
   );
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
                200,
                updatedTweet,
                "Tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    // here the bug fixed by copilot and the bug is no authorization check on update/delete. Explanation: Users could update/delete tweets they don't own.
    const tweet = await Tweet.findById(tweetId)
    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if(tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    // Modified by Antigravity: delete all likes associated with this tweet
    await Like.deleteMany({ tweet: tweetId });

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedTweet,
                "Tweet deleted successfully"
            )
        )
})

export {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}