import mongoose,{Schema} from "mongoose";
const playlistSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        maxlength:100,

    },
    description:{
        type:String,
        required:false,
    },
    // here the bug fixed by copilot and the bug is field name createdBy but controllers queried owner. Explanation: This caused queries to fail as the field name didn't match.
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    videos:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    //extra hai
    videoscount:{
        type:Number,
        default:0
    }
}, {timestamps:true})
const Playlist = mongoose.model("Playlist",playlistSchema);
export default Playlist;
