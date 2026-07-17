import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
// Modified by Antigravity: imported cleanup utility to clear local temp files
import cleanupLocalFiles from "../utils/cleanup.js";
// Modified by Antigravity: imported related models for user account deletion cascading cleanup
import Video from "../models/video.models.js";
import Playlist from "../models/playlist.models.js";
import Tweet from "../models/tweet.models.js";
import Comment from "../models/comment.models.js";
import Like from "../models/like.models.js";
import Subscription from "../models/subscription.models.js";
import {cloudinaryupload}  from "../utils/cloudinary.js";
// here the bug fixed by copilot and the bug is import { decode } from "jsonwebtoken" — wrong import, jwt never available. Explanation: This caused import error as decode is not exported from jsonwebtoken.
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getCookieOptions = () => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };
};




const registerUser = asyncHandler(async (req, res, next) => {
    try {
        const { fullName, email, username, password } = req.body;

        // Validate required text fields
        if (!fullName || !email || !username || !password ||
            [fullName, email, username, password].some((field) => field.trim() === '')) {
            throw new ApiError(400, 'All fields are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new ApiError(400, 'Please provide a valid email address');
        }

        // Validate username: alphanumeric + underscores only
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username.trim())) {
            throw new ApiError(400, 'Username can only contain letters, numbers, and underscores');
        }

        // Validate password strength
        if (password.length < 6) {
            throw new ApiError(400, 'Password must be at least 6 characters long');
        }

        // Check if user with the same email or username already exists
        const existedUser = await User.findOne({
            $or: [
                { username: username.trim().toLowerCase() },
                { email: email.trim().toLowerCase() }
            ]
        });
        if (existedUser) {
            if (existedUser.username === username.trim().toLowerCase()) {
                throw new ApiError(409, `Username "${username.trim()}" is already taken. Please choose another.`);
            }
            throw new ApiError(409, 'An account with this email already exists. Please sign in instead.');
        }

        // Check if avatar file was uploaded
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const avatarFileSize = req.files?.avatar?.[0]?.size || 0;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, 'Profile avatar image is required to create your account');
        }

        // Validate avatar file size (max 5MB)
        if (avatarFileSize > 5 * 1024 * 1024) {
            throw new ApiError(400, `Avatar image is too large (${(avatarFileSize / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 5MB.`);
        }

        // Upload avatar to Cloudinary
        const avatar = await cloudinaryupload(avatarLocalPath);
        if (!avatar || !avatar.url) {
            throw new ApiError(500, 'Avatar image upload failed. Please try again with a smaller image.');
        }

        // Upload cover image to Cloudinary (optional)
        let coverImage = null;
        if (coverImageLocalPath) {
            coverImage = await cloudinaryupload(coverImageLocalPath);
            // Cover image upload failure is non-fatal — we warn but continue
            if (!coverImage || !coverImage.url) {
                console.warn('Cover image upload failed — continuing without cover image');
                coverImage = null;
            }
        }

        // Create user in the database
        let user;
        try {
            user = await User.create({
                fullName: fullName.trim(),
                avatar: avatar.url,
                coverImage: coverImage?.url || '',
                email: email.trim().toLowerCase(),
                password,
                username: username.trim().toLowerCase(),
                provider: 'local'
            });
        } catch (dbError) {
            // DB write failed — clean up the uploaded avatar from Cloudinary
            if (avatar?.public_id) {
                const { deleteFromCloudinary } = await import('../utils/cloudinary.js');
                await deleteFromCloudinary(avatar.public_id, 'image').catch(() => {});
            }
            // Handle duplicate key error from DB constraint (race condition)
            if (dbError.code === 11000) {
                const field = Object.keys(dbError.keyValue || {})[0];
                throw new ApiError(409, `An account with this ${field} already exists.`);
            }
            throw new ApiError(500, 'Something went wrong while creating your account. Please try again.');
        }

        // Fetch the created user without sensitive fields
        const createdUser = await User.findById(user._id).select('-password -refreshToken');
        if (!createdUser) {
            throw new ApiError(500, 'Something went wrong while registering the user');
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, 'User registered successfully')
        );
    } catch (error) {
        // Cleanup local temp files on any error
        cleanupLocalFiles(req);
        throw error;
    }
});

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        // Fix #3 & #10: Skip bcrypt pre-save hook — avoids crashing social-login users with empty passwords
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating authentication tokens");
    }
}


    
const loginUser = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Please provide your username or email address to login");
    }

    if (!password) {
        throw new ApiError(400, "Password is required to login");
    }

    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    });

    if (!user) {
        throw new ApiError(404, "No account found with this username or email. Please register first.");
    }

    // Fix #4: Prevent OAuth users from logging in with password — security hole
    if (user.provider && user.provider !== 'local') {
        const providerName = user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
        throw new ApiError(400, `This account was created using ${providerName}. Please sign in with ${providerName} instead.`);
    }

    if (!(await user.isPasswordMatched(password))) {
        throw new ApiError(401, "Incorrect password. Please try again.");
    }
    

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
     
    const options = getCookieOptions();

    
    
    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200, {
            user:loggedInUser, 
            accessToken, 
            refreshToken
        },
        
    "User logged in successfully")
    );




});


const logoutUser = asyncHandler(async (req, res, next) => {

 await User.findByIdAndUpdate(
    req.user._id, 
    {
       $set: { 
            refreshToken: null
       }
    },
    {
        new:true
    }
);


    const options = getCookieOptions();



return res
.status(200)
.clearCookie("refreshToken", options)
.clearCookie("accessToken", options)
.json(
    new ApiResponse(200, {}, "User logged out successfully")
);



});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    try {
        // here the bug fixed by copilot and the bug is req.cookie.refreshToken — should be req.cookies.refreshToken (plural). Explanation: Cookies are stored in req.cookies, not req.cookie, causing undefined token access.
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(401,"Invalid request, refresh token is missing");
        }
    
        // here the bug fixed by copilot and the bug is jwt.verify(...) return value never captured into decodedToken. Explanation: The decoded payload was not stored, causing decodedToken to be undefined in subsequent lines.
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401,"user not found with this token");
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"refresh token is invalid or expired");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    
        const options = getCookieOptions();
    
        return res
        .status(200) 
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken
            },
            
        "Refresh token generated successfully")
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    // Fix #5: Validate new password
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both current and new passwords are required");
    }
    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters long");
    }
    if (oldPassword === newPassword) {
        throw new ApiError(400, "New password must be different from your current password");
    }

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.isPasswordMatched(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Your current password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    // Populate watchHistory with full video details for the Watch History page
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken")
        .populate({
            path: "watchHistory",
            select: "title thumbnail views duration owner createdAt",
            populate: {
                path: "owner",
                select: "fullName avatar username"
            }
        });

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res, next)=>{
    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"ALL feilds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account deatils updated successfully"))

})

const updateUserAvtar = asyncHandler(async (req, res, next) => {
    try {
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, "Please provide an avatar image file to upload");
        }

        const avatar = await cloudinaryupload(avatarLocalPath);

        // Fix #6: Proper null-safe check with correct error message
        if (!avatar || !avatar.url) {
            throw new ApiError(500, "Avatar image upload failed. Please try again.");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: { avatar: avatar.url } },
            { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Profile photo updated successfully"));
    } catch (error) {
        cleanupLocalFiles(req);
        throw error;
    }
})


const updateUsercoverImage = asyncHandler(async (req, res, next) => {
    try {
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Please provide a cover image file to upload");
        }

        const coverImage = await cloudinaryupload(coverImageLocalPath);

        // Fix #6: Proper null-safe check with correct error message for cover image
        if (!coverImage || !coverImage.url) {
            throw new ApiError(500, "Cover image upload failed. Please try again.");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: { coverImage: coverImage.url } },
            { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Cover image updated successfully"));
    } catch (error) {
        cleanupLocalFiles(req);
        throw error;
    }
})

const deleteUser = asyncHandler(async (req, res, next) => {
    /* Modified by Antigravity: User Account Deletion with full cascading cleanup */
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 1. Find and delete all videos uploaded by user, plus their likes/comments/playlist references
    const videos = await Video.find({ owner: userId });
    for (const video of videos) {
        await Like.deleteMany({ video: video._id });
        await Comment.deleteMany({ video: video._id });
        await Playlist.updateMany({}, { $pull: { videos: video._id } });
        await Video.findByIdAndDelete(video._id);
    }

    // 2. Delete all playlists created by the user
    await Playlist.deleteMany({ owner: userId });

    // 3. Delete all tweets posted by the user, and their associated likes
    const tweets = await Tweet.find({ owner: userId });
    for (const tweet of tweets) {
        await Like.deleteMany({ tweet: tweet._id });
        await Tweet.findByIdAndDelete(tweet._id);
    }

    // 4. Delete all comments posted by the user
    await Comment.deleteMany({ commentby: userId });

    // 5. Delete all likes created by the user
    await Like.deleteMany({ likedby: userId });

    // 6. Delete subscriptions where user is subscriber or channel owner
    await Subscription.deleteMany({
        $or: [
            { subscriber: userId },
            { channel: userId }
        ]
    });

    // 7. Delete the user document itself
    await User.findByIdAndDelete(userId);

    const options = getCookieOptions();

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User account and all associated data deleted successfully"));
});

const socialLoginOrRegister = asyncHandler(async (req, res, next) => {
    const { username, email, fullName, avatar, provider, providerId } = req.body;

    if (!provider || !providerId) {
        throw new ApiError(400, "Provider and Provider ID are required");
    }

    // Check if user exists with matching social provider id
    const providerIdField = `${provider}Id`;
    let user = await User.findOne({ [providerIdField]: providerId });

    // If not found by social ID, check by email
    if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
            // Update user to link social account
            user[providerIdField] = providerId;
            user.provider = provider;
            await user.save();
        }
    }

    // If user still doesn't exist, register them
    if (!user) {
        let finalUsername = username ? username.toLowerCase().replace(/\s+/g, '') : `user_${providerId}`;
        
        // Ensure username is unique
        let usernameExists = await User.findOne({ username: finalUsername });
        while (usernameExists) {
            finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
            usernameExists = await User.findOne({ username: finalUsername });
        }

        const finalEmail = email || `${finalUsername}@${provider}.com`;

        user = await User.create({
            username: finalUsername,
            fullName: fullName || username || `Social User`,
            email: finalEmail,
            avatar: avatar || "https://via.placeholder.com/150",
            provider,
            [providerIdField]: providerId,
            password: "" // password-less social login
        });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = getCookieOptions();

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "Social login successful")
        );
});

const mobileLoginOrRegister = asyncHandler(async (req, res, next) => {
    const { mobileNumber, fullName, username, avatar, password, action } = req.body;

    if (!mobileNumber) {
        throw new ApiError(400, "Mobile number is required");
    }

    let user = await User.findOne({ mobileNumber });

    // OTP / Password-less Mobile login or signup simulation
    if (action === "otp_login") {
        if (!user) {
            // Register a new mobile user automatically with verification code
            let finalUsername = username ? username.toLowerCase().replace(/\s+/g, '') : `user_${mobileNumber.slice(-4)}`;
            let usernameExists = await User.findOne({ username: finalUsername });
            while (usernameExists) {
                finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
                usernameExists = await User.findOne({ username: finalUsername });
            }

            user = await User.create({
                username: finalUsername,
                fullName: fullName || `Mobile User`,
                email: `${mobileNumber}@glimpse.com`,
                avatar: avatar || "https://via.placeholder.com/150",
                provider: "mobile",
                mobileNumber,
                password: "" // password-less
            });
        }
    } else {
        // Standard password based mobile auth
        if (action === "login") {
            if (!user) {
                throw new ApiError(404, "User with this mobile number does not exist");
            }
            const isPasswordCorrect = await user.isPasswordMatched(password);
            if (!isPasswordCorrect) {
                throw new ApiError(401, "Invalid password credentials");
            }
        } else if (action === "register") {
            if (user) {
                throw new ApiError(409, "User with this mobile number already exists");
            }
            if (!username || !fullName || !password) {
                throw new ApiError(400, "All registration fields are required");
            }

            let finalUsername = username.toLowerCase().replace(/\s+/g, '');
            let usernameExists = await User.findOne({ username: finalUsername });
            if (usernameExists) {
                throw new ApiError(409, "Username already taken");
            }

            user = await User.create({
                username: finalUsername,
                fullName,
                email: `${mobileNumber}@glimpse.com`,
                avatar: avatar || "https://via.placeholder.com/150",
                provider: "mobile",
                mobileNumber,
                password
            });
        } else {
            throw new ApiError(400, "Invalid auth action specified");
        }
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = getCookieOptions();

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "Mobile authentication successful")
        );
});

const googleOAuthLogin = asyncHandler(async (req, res, next) => {
    const { credential } = req.body;
    if (!credential) {
        throw new ApiError(400, "Google ID token is required");
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
            throw new ApiError(400, "Invalid Google ID token");
        }

        const { email, name, picture, sub: googleId } = payload;

        // Check if user exists with matching googleId
        let user = await User.findOne({ googleId });

        // If not found by googleId, check by email
        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                // Link google account to existing local/other user
                user.googleId = googleId;
                user.provider = "google";
                await user.save();
            }
        }

        // If user still doesn't exist, create a new one
        if (!user) {
            // Generate a unique username from email
            let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
            let username = baseUsername;
            let usernameExists = await User.findOne({ username });
            while (usernameExists) {
                username = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
                usernameExists = await User.findOne({ username });
            }

            user = await User.create({
                username,
                fullName: name || "Google User",
                email,
                avatar: picture || "https://api.dicebear.com/7.x/bottts/svg?seed=default",
                provider: "google",
                googleId,
                password: "" // password-less social login
            });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = getCookieOptions();

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(200, {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }, "Google authentication successful")
            );
    } catch (error) {
        console.error("Error verifying Google ID token:", error);
        throw new ApiError(401, "Google token verification failed");
    }
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUsercoverImage,
    deleteUser,
    socialLoginOrRegister,
    mobileLoginOrRegister,
    googleOAuthLogin
};