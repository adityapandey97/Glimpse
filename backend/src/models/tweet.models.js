import mongoose,{Schema} from "mongoose";

const tweetSchema = new mongoose.Schema(
    {
        content:{
            type:String,
            required:true,
            trim:true,
            maxlength:280
        },
        // here the bug fixed by copilot and the bug is typo owener -> owner. Explanation: This caused field name mismatch in queries and population.
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    },
    {timestamps:true}
)
const Tweet = mongoose.model("Tweet",tweetSchema);
export default Tweet;