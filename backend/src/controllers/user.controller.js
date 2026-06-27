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



const registerUser = asyncHandler(async (req, res, next) => {
    // error resolved by copilot: controller functions were missing 'next' parameter, causing potential scope issues with Express middleware chain. Added 'next' to all asyncHandler-wrapped functions for proper middleware compatibility.
    try {
        // req.body contail data like text or json number boolean
        // here we are destructuring the data from req.body
        const { fullName, email, username, password } = req.body;

        // Debug logs
        console.log("req.files:", req.files);
        console.log("req.body:", req.body);


        // this is use to check all field are provided or not
        // and using the apierror to throw the error with status code and message in the proper way we desing it in utils/apiError.js
        if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }


        // check if user with the same email or username already exists
        // $or is a mongoDB operator to check multiple conditions(advanced query)
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }


        // ceck if files are uploaded
        // as avtar is required so we go through this specif check but coverimage is not required so we dont need to check this in that manner but
        // but still we can check if we want to store null or defauld vale to upload on cloudinary
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;
        let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        // error resolved by copilot: improved file path access to prevent crashes when files are missing, using optional chaining for safer property access 

        // required file so chek confiormly it was given or not  if not given then throw error
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }



        // upload files to cloudinary and get the uploaded file urls
        // error resolved by copilot: function name mismatch - imported as cloudinaryupload but called as uploadOnCloudinary, causing "uploadOnCloudinary is not defined" error
        const avatar = await cloudinaryupload(avatarLocalPath);
        const coverImage = coverImageLocalPath ? await cloudinaryupload(coverImageLocalPath) : null;

        // error resolved by copilot: made cover image upload conditional to handle cases where cover image is not provided, preventing unnecessary cloudinary calls



        // again check if avatar upload was successfull or not
        if (!avatar) {
            throw new ApiError(400, "Avatar file is required");
        }


        // as all data given perfectly so we create the user in the database
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),
        });





        // fetch the created user without password and refreshToken fields to send in response
        const createdUser = await User.findById(user._id).select("-password -refreshToken");


        // if user creation failed then throw the error
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }


        // send success response with created user data
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
    } catch (error) {
        // Modified by Antigravity: Cleanup local uploaded temp files on error
        cleanupLocalFiles(req);
        throw error;
    }
});

const generateAccessAndRefreshToken = async (userId)=>
{
    try{
      const user= await User.findById(userId);
      // here the bug fixed by copilot and the bug is user.genrateAccessToken() / user.genrateRefreshToken() — wrong method names. Explanation: Methods were named generateAccessToken and generateRefreshToken in model, causing method not found errors.
      const accessToken= user.generateAccessToken();
      const refreshToken= user.generateRefreshToken();
      user.refreshToken= refreshToken;
      await user.save();
      return {accessToken, refreshToken};
    } catch(error){
      throw new ApiError(500, "Error generating tokens");
    }
    
}


    
const loginUser = asyncHandler(async (req, res, next) => {
    const {username, email, password } = req.body;


    if(!username && !email){
        throw new ApiError(400, "Username or Email is required to login");
    }


    if(!password){
        throw new ApiError(400, "Password is required to login");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    });
    
    
    if(!user){
        throw new ApiError(404, "User does not exist");
    }


    if(!(await user.isPasswordMatched(password))){
        throw new ApiError(401, "Invalid credentials");
    }
    

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
     
    const  options ={
        // here the bug fixed by copilot and the bug is httpsonly: true — should be httpOnly: true (cookies not protected!). Explanation: Incorrect property name meant cookies were not properly secured against client-side access.
        httpOnly:true,
        secure:true
    }

    
    
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


const  options ={
        // here the bug fixed by copilot and the bug is httpsonly: true — should be httpOnly: true (cookies not protected!). Explanation: Incorrect property name meant cookies were not properly secured against client-side access.
        httpOnly:true,
        secure:true
    }



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
    
        const  options ={
            // here the bug fixed by copilot and the bug is httpsonly: true — should be httpOnly: true (cookies not protected!). Explanation: Incorrect property name meant cookies were not properly secured against client-side access.
            httpOnly:true,
            secure:true 
        }
    
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

const changeCurrentPassword = asyncHandler(async(req,res, next)=>{
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)

    // Modified by Antigravity: changed user.isPasswordCorrect to user.isPasswordMatched to match the schema methods
    const isPasswordCorrect = await user.isPasswordMatched(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password")
    
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false })

    return res 
    .status(200)
    .json(new ApiResponse(200, {}, "password reset successfully"))


})

const getCurrentUser = asyncHandler(async(req,res, next)=>{

    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
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

const updateUserAvtar = asyncHandler(async(req,res, next)=>{
    try {
        const avatarLocalPath = req.file?.path

        if(!avatarLocalPath){
            throw new ApiError(400 , "avatar not found in local path")
        }

        // error resolved by copilot: function name mismatch - imported as cloudinaryupload but called as uploadOnCloudinary, causing "uploadOnCloudinary is not defined" error
        const avatar = await cloudinaryupload(avatarLocalPath)

        if(!avatar.url){
            throw new ApiError(400, "not uploaded on cloud")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse( 200 ,user,"update avatar successfully"))
    } catch (error) {
        // Modified by Antigravity: Cleanup local uploaded temp files on error
        cleanupLocalFiles(req);
        throw error;
    }
})


const updateUsercoverImage = asyncHandler(async(req,res, next)=>{
    try {
        const coverImageLocalPath = req.file?.path

        if(!coverImageLocalPath){
            throw new ApiError(400 , "avatar not found in local path")
        }

        // error resolved by copilot: function name mismatch - imported as cloudinaryupload but called as uploadOnCloudinary, causing "uploadOnCloudinary is not defined" error
        const coverImage = await cloudinaryupload(coverImageLocalPath)

        if(!coverImage.url){
            throw new ApiError(400, "not uploaded on cloud")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse( 200 ,user,"update coverImage successfully"))
    } catch (error) {
        // Modified by Antigravity: Cleanup local uploaded temp files on error
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

    // 8. Clear the auth cookies
    const options = {
        httpOnly: true,
        secure: true
    };

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

    const options = {
        httpOnly: true,
        secure: true
    };

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

    const options = {
        httpOnly: true,
        secure: true
    };

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

        const options = {
            httpOnly: true,
            secure: true
        };

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