import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
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


const registerUser = asyncHandler(async (req, res, next) => {
    // error resolved by copilot: controller functions were missing 'next' parameter, causing potential scope issues with Express middleware chain. Added 'next' to all asyncHandler-wrapped functions for proper middleware compatibility.

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



});

const genrateAccessAndRefreshToken = async (userId)=>
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
    

    const {accessToken, refreshToken} = await genrateAccessAndRefreshToken(user._id);
 
    const loogedInUser = await User.findById(user._id).select("-password -refreshToken");
     
    const  options ={
        // here the bug fixed by copilot and the bug is httpsonly: true — should be httpOnly: true (cookies not protected!). Explanation: Incorrect property name meant cookies were not properly secured against client-side access.