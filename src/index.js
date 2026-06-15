import dotenv from "dotenv";
import dbconect from "./db/dbconection.js";
import {app} from "./app.js";


dotenv .config({
    path:'./env'
})


// Modified by Antigravity: Start Express server even if the MongoDB connection fails to allow local preview/offline testing
dbconect()
.then(()=>{
    const port = process.env.PORT || 8000;
    app.listen(port,()=>{
        console.log(`server is listening at:${port}`);
    })
    app.on("error",(error)=>{
        console.log("ERROR:",error)
    })
})
.catch((error)=>{
    console.log(`mongodb conection is failed!! starting server in offline fallback mode`, error)
    const port = process.env.PORT || 8000;
    app.listen(port,()=>{
        console.log(`server is listening at:${port} (OFFLINE Fallback Mode)`);
    })
})