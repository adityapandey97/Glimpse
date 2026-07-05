import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    incrementVideoView,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import upload from "../middlewares/multer.middleware.js"

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

// Public: Get all videos (home feed)
router.route("/").get(getAllVideos);

// Protected: Upload a new video
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
);

// Public: Get a specific video; with optional auth for watch history
router.route("/:videoId").get(optionalAuth, getVideoById);

// Feature: Increment view count (optional auth to track watch history)
router.route("/:videoId/view").patch(optionalAuth, incrementVideoView);

// Protected: Edit / delete a video
router.route("/:videoId")
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

// Protected: Toggle publish status
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router