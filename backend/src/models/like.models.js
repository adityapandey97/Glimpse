import mongoose,{Schema} from "mongoose";
const likeSchema = new mongoose.Schema(
    {
        likedby:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        // here the bug fixed by copilot and the bug is all three fields (video, tweet, comment) were required: true, but a like can only be for ONE entity. Explanation: This prevented creating likes as you couldn't set only one field while keeping others null.
        tweet:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Tweet",
            required:false
        },
        comment:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment",
            required:false
        },
        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video",
            required:false
        },
        emoji: {
            type: String,
            default: "👍"
        }
        
    }, {timestamps:true}
)
const Like = mongoose.model("Like",likeSchema);
export default Like;