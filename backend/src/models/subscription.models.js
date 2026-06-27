import mongoose,{Schema} from "mongoose";


const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    // here the bug fixed by copilot and the bug is field was channels but controllers used channel. Explanation: This caused field mismatch in database operations.
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
    
},{timestamps: true});

const subscription=mongoose.model("Subscription",subscriptionSchema);

export default subscription;