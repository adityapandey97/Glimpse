import mongoose,{Schema} from "mongoose";
const commentsSchema = new mongoose.Schema(
    {
        content:{
            type:String,
            required:true,
            trim:true,
        },
        commentby:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video",
            required:true
        },
        //ye extra hai
        likecount:{
            type:Number,
            default:0
        },

    }
)
const Comment = mongoose.model("Comment",commentsSchema);
export default Comment;
    