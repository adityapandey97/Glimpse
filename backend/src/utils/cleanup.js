import fs from 'fs';

/**
 * Modified by Antigravity: Cleans up any files uploaded by Multer to the local temp directory
 * in case of query validation errors or upload failures.
 * @param {Express.Request} req 
 */
export const cleanupLocalFiles = (req) => {
    try {
        if (!req) return;
        
        // Single file upload cleanup (e.g. req.file)
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`Cleaned up temporary file: ${req.file.path}`);
        }
        
        // Multiple fields file upload cleanup (e.g. req.files)
        if (req.files) {
            for (const fileKey in req.files) {
                const filesArray = req.files[fileKey];
                if (Array.isArray(filesArray)) {
                    for (const file of filesArray) {
                        if (file.path && fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                            console.log(`Cleaned up temporary file: ${file.path}`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to clean up local temp files:", error);
    }
};

export default cleanupLocalFiles;
