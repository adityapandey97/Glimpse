import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
    secure:true
});
const cloudinaryupload=async(localfilepath)=>{
    try{
        if(!localfilepath) return null;
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto",
        });
        // console.log("Cloudinary upload response:", response);
        fs.unlinkSync(localfilepath);
        return response;
    }catch(error){
        fs.unlinkSync(localfilepath);
        return null;
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return response;
    } catch (error) {
        console.error("Cloudinary delete failed:", error);
        return null;
    }
}

export { cloudinaryupload, deleteFromCloudinary };
