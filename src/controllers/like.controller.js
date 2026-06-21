import mongoose, {isValidObjectId} from "mongoose"
import Like from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {emoji} = req.body;
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const targetEmoji = emoji || "👍";
    const isLiked = await Like.findOne({video:videoId, likedby:req.user._id});

    if(!isLiked){
        const newLike = await Like.create({video:videoId, likedby:req.user._id, emoji: targetEmoji});
        return res.status(200).json(
            new ApiResponse(200, newLike, "Video liked successfully")
        )
    } else {
        // If the user liked it with a DIFFERENT emoji, update the emoji instead of unliking
        if (emoji && isLiked.emoji !== targetEmoji) {
            isLiked.emoji = targetEmoji;
            await isLiked.save();
            return res.status(200).json(
                new ApiResponse(200, isLiked, "Reaction updated successfully")
            )
        } else {
            // Otherwise, toggle off (unlike)
            await Like.findByIdAndDelete(isLiked._id);
            return res.status(200).json(
                new ApiResponse(200, null, "Video unliked successfully")
            )
        }
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }
    // Modified by Antigravity: replaced owner with likedby to match schema
    const isLiked=await Like.findOne({comment:commentId,likedby:req.user._id})
    if(!isLiked){
        await Like.create({comment:commentId,likedby:req.user._id})
        return res.status(200).json(
            new ApiResponse(200,null,"Comment liked successfully")
        )
    }else{
        await Like.findByIdAndDelete(isLiked._id)
        return res.status(200).json(
            new ApiResponse(200,null,"Comment unliked successfully")
        )
    }
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId")
    }
    // Modified by Antigravity: replaced owner with likedby to match schema
    const isLiked=await Like.findOne({tweet:tweetId,likedby:req.user._id})
    if(!isLiked){
        await Like.create({tweet:tweetId,likedby:req.user._id})
        return res.status(200).json(
            new ApiResponse(200,null,"Tweet liked successfully")
        )
    }else{
        await Like.findByIdAndDelete(isLiked._id)
        return res.status(200).json(
            new ApiResponse(200,null,"Tweet unliked successfully")
        )
    }
    //TODO: toggle like on tweet
}
)
//not completed yet
const getLikedVideos = asyncHandler(async (req, res) => {
    // Modified by Antigravity: replaced owner with likedby, and findOne with find to get all liked videos
    const likedVideosList = await Like.find({
        likedby: req.user._id,
        video: { $exists: true, $ne: null }
    }).populate("video")
    
    const videos = likedVideosList.map(like => like.video).filter(Boolean)
    
    return res.status(200).json(
        new ApiResponse(200, videos, "Liked videos fetched successfully")
    )
})

const getVideoReactions = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const totalLikes = await Like.countDocuments({ video: videoId });

    const groupedReactions = await Like.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $group: { _id: "$emoji", count: { $sum: 1 } } }
    ]);

    const reactions = {
        "👍": 0,
        "❤️": 0,
        "😂": 0,
        "😮": 0,
        "😢": 0,
        "😡": 0
    };

    groupedReactions.forEach(item => {
        if (item._id && reactions[item._id] !== undefined) {
            reactions[item._id] = item.count;
        }
    });

    let userReaction = null;
    if (req.user?._id) {
        const userLike = await Like.findOne({ video: videoId, likedby: req.user._id });
        if (userLike) {
            userReaction = userLike.emoji;
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { totalLikes, reactions, userReaction }, "Video reactions fetched successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoReactions
}