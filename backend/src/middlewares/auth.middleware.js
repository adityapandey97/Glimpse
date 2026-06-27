import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import User from "../models/user.models.js";



export const  verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // here the bug fixed by copilot and the bug is req.headers("Authorization") - headers is an object, not a function. Explanation: This caused a TypeError when trying to access Authorization header, crashing every protected request.
        const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
         
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user){
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});