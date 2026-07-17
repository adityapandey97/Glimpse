// here the bug fixed by copilot and the bug is import CookieParser — wrong casing (should be cookieParser). Explanation: Module names are case-sensitive.
import cookieParser from "cookie-parser";
import cors from "cors"
import express from "express"
// Modified by Antigravity: Import mongoose to check connection status in middleware
import mongoose from "mongoose";
const app  = express();

//USE TO HANDLE CROSS ORGIN ERROR IN THE BROWSER TO ALLOW THE FRONTEND TO READ THE BACKENG OR LISITEN ON SERVER
app.use(cors({
    origin:process.env.CROSS_ORIGIN_URL,
    // here the bug fixed by copilot and the bug is Credentials: true — wrong key casing (should be credentials). Explanation: CORS options are case-sensitive.
    credentials:true
}))
//USE TO TAKE JSON FILE DATA FROM SERVER
app.use(express.json({
    limit:`1mb`
}))
//USE TO READ DATA FROM URL AND DECODE THEM
app.use(express.urlencoded({
    extended:true,
    limit:`1mb`
}))
//THIS IS FOR TAKING YOUR LOCAL DATA OF SOME SPECIFIC ASSEST AS A BACKEP
app.use(express.static('public'))
//cookie-parser is an Express middleware that parses cookies from incoming HTTP requests and makes them available in req.cookies for easy access.
//it reads cookies from the browser request and converts them into a JavaScript object.
app.use(cookieParser())

// Modified by Antigravity: Intercept requests when MongoDB is offline and return a clean 503 error
app.use((req, res, next) => {
    // Skip db check for healthcheck route
    if (req.path.startsWith('/api/v1/healthcheck')) {
        return next();
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: "Database connection is offline. Operating in fallback mode."
        });
    }
    next();
});

// routes import
import userRouter from "./routes/user.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import messageRouter from "./routes/message.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// routes use
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/follows", subscriptionRouter)
app.use("/api/v1/chat", messageRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
 
// https:localhost:8000/api/v1/users/register

// Global error handler — handles all thrown errors including Multer, JWT, and ApiError
app.use((err, req, res, next) => {
    console.error("Backend Error:", err.name, err.message);

    // Handle Multer-specific errors (file size/count limit violations)
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File is too large. Maximum allowed size is 50MB per file.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files uploaded at once.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = err.message || 'Unexpected file field or invalid file type.';
        } else {
            message = err.message || 'File upload failed.';
        }
        return res.status(400).json({ success: false, message, errors: [] });
    }

    // Handle plain validation errors from our multer fileFilter (file type rejection)
    if (err.message && (
        err.message.startsWith('Invalid video format') ||
        err.message.startsWith('Invalid image format') ||
        err.message.startsWith('Unsupported file type')
    )) {
        return res.status(400).json({ success: false, message: err.message, errors: [] });
    }

    // Handle JSON syntax errors (malformed request body)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body. Please check your request format.',
            errors: []
        });
    }

    // Handle JWT errors explicitly
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.',
            errors: []
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please log in again.',
            errors: []
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: errors[0] || 'Validation failed',
            errors
        });
    }

    // Handle Mongoose duplicate key errors (e.g. unique constraint violations)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            success: false,
            message: `An account with this ${field} already exists.`,
            errors: []
        });
    }

    // Default: use ApiError fields or fallback values
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || []
    });
});

export { app };