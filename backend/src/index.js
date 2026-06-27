import dotenv from "dotenv";
import connectDB from "./db/dbConnection.js";
import {app} from "./app.js";


dotenv.config({
    path:'./.env'
})


// Modified by Antigravity: Start Express server even if the MongoDB connection fails to allow local preview/offline testing
connectDB()
.then(()=>{
    const port = process.env.PORT || 8000;
    app.listen(port,()=>{
        console.log(`Server is listening at: ${port}`);
    })
    app.on("error",(error)=>{
        console.log("ERROR:",error)
    })
})
.catch((error)=>{
    console.log(`MongoDB connection failed!! Starting server in offline fallback mode`, error)
    const port = process.env.PORT || 8000;
    app.listen(port,()=>{
        console.log(`Server is listening at: ${port} (OFFLINE Fallback Mode)`);
    })
})



























/*
this was a method 1 to connect db and handle erro but it was bad practice so we use method 2
import mongoose from "mongoose";
import { DB_name } from "./constants.js";
import express from "express";
const app = express();
(async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_name}`);
        console.log(`\nMongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
            app.on("error",(error) =>{
                console.log("Error:",error);
                throw error
            })
            app.listen(process.env.PORT,()=>{
                console.log('app is lisintig at port:${prosses.env.PORT}');
            })
    }

    catch (error) {
        console.log("Database connection failed", error);
        process.exit(1);
    }
})();
*/