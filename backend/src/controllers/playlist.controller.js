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
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist, 
            "Playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id")
    }
    // here the bug fixed by copilot and the bug is findByIdAndUpdate used instead of findById. Explanation: findByIdAndUpdate is for updating, but here we just need to find and then modify.
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    // here the bug fixed by copilot and the bug is no ownership checks. Explanation: Users could modify playlists they don't own.
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }
    const videoExists = playlist.videos.some(video => video.toString() === videoId)
    if(videoExists) {
        throw new ApiError(400, "Video already exists in playlist")
    }
    playlist.videos.push(videoId)
    await playlist.save()
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist, 
            "Video added to playlist successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id")
    }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    // here the bug fixed by copilot and the bug is no ownership checks. Explanation: Users could modify playlists they don't own.
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }
    const videoIndex = playlist.videos.findIndex(video => video.toString() === videoId)
    if(videoIndex === -1) {
        throw new ApiError(404, "Video not found in playlist")
    }
    playlist.videos.splice(videoIndex, 1)
    await playlist.save()
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist, 
            "Video removed from playlist successfully"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    // here the bug fixed by copilot and the bug is no ownership checks. Explanation: Users could delete playlists they don't own.
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist, 
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
   if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    // here the bug fixed by copilot and the bug is no ownership checks. Explanation: Users could update playlists they don't own.
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }
    if(!name && !description) {
        throw new ApiError(400, "Name and description are required")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name || playlist.name,
                description: description || playlist.description
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            updatedPlaylist, 
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}