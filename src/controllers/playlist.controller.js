import mongoose, {isValidObjectId} from "mongoose"
import Playlist from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }


    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if(!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            playlist, 
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const playlists = await Playlist.find({owner: userId})

    // Modified by Antigravity: return 200 with empty list instead of throwing 404 to avoid client crashes
    if(!playlists || playlists.length === 0) {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                [], 
                "No playlists found for this user"
            )
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlists, 
            "Playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
   if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }