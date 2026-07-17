import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Timestamp prefix prevents file name collisions on concurrent uploads
        cb(null, Date.now() + "-" + file.originalname);
    }
});

/**
 * File type validation — only accept images and videos.
 * Edge case: rejects PDFs, executables, and other binary blobs
 * that could slip through if accept="" is bypassed on the client.
 */
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/3gpp'];

    const fieldName = file.fieldname;

    if (fieldName === 'videoFile') {
        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid video format "${file.mimetype}". Allowed formats: MP4, WebM, OGG, MOV, AVI.`));
        }
    } else if (fieldName === 'avatar' || fieldName === 'thumbnail' || fieldName === 'coverImage') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid image format "${file.mimetype}" for ${fieldName}. Allowed formats: JPEG, PNG, WebP, GIF.`));
        }
    } else {
        // Unknown field — allow generically if it's a known media type
        if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        // 50MB max for video uploads, 5MB for images
        // Note: multer doesn't differentiate per-field here, so we enforce
        // the larger limit and do field-specific checks in controllers.
        fileSize: 50 * 1024 * 1024, // 50MB overall per file
    }
});

export default upload;