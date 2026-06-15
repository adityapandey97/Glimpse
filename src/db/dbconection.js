import mongoose from "mongoose";
import { DB_name } from "../constants.js";
const dbconect=async()=>{
    try{
        const conectioninstanse=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
        console.log(`\n mongodb conected!!:DB HOST:${conectioninstanse.connection.host}`);
    }catch(error){
        console.log("database conection get failed",error);
        // Modified by Antigravity: Throw error instead of process.exit(1) to support fallback startup
        throw error;
    }
}
export default dbconect;