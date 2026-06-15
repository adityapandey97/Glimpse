import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUsercoverImage,
    // Modified by Antigravity: imported deleteUser controller
    deleteUser
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(
    upload.fields([
        { 
            name: "avatar", 
            maxCount: 1 
        },
        { 
            name: "coverImage", 
            maxCount: 1 
        }

    // error resolved by copilot: corrected field name from "coverimage" to "coverImage" to match controller expectations and prevent undefined file access
    ]),
    registerUser
);

router.route("/login").post(
    loginUser
);

router.route("/logout").post(
    verifyJWT,
    logoutUser
);

router.route("/refresh-token").post(
    refreshAccessToken
);

router.route("/change-password").post(
    verifyJWT,
    changeCurrentPassword
);

router.route("/me").get(
    verifyJWT,
    getCurrentUser