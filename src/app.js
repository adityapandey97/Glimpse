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
    limit:`50kb`
}))
//USE TO READ DATA FROM URL AND DECODE THEM
app.use(express.urlencoded({
    extended:true,
    limit:`50kb`
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

// here the bug fixed by copilot and the bug is no global error handler. Explanation: Without a global error handler, unhandled errors would crash the server or return generic responses.
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || []
    });
});

export { app };