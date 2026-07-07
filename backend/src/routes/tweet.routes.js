import { Router } from 'express';
import {
    getAllTweets,
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// Optional auth middleware — attaches user if token is present, but doesn't block guests
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const jwt = await import("jsonwebtoken");
            const decoded = jwt.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const User = (await import("../models/user.models.js")).default;
            const user = await User.findById(decoded._id).select("-password -refreshToken");
            req.user = user || null;
        }
    } catch (err) {
        req.user = null; // Token invalid — guest access
    }
    next();
};

// Public: Get all tweets for community feed (with optional auth to check like status)
router.route("/").get(optionalAuth, getAllTweets);

// Protected routes
router.route("/").post(verifyJWT, createTweet);
router.route("/user/:userId").get(optionalAuth, getUserTweets);
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router