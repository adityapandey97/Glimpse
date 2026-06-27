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
    deleteUser,
    socialLoginOrRegister,
    mobileLoginOrRegister,
    googleOAuthLogin
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
);

router.route("/update-account-details").patch(
    verifyJWT,
    updateAccountDetails
);

router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvtar
);

router.route("/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUsercoverImage
);

// Modified by Antigravity: registered user account deletion route
router.route("/delete-account").delete(
    verifyJWT,
    deleteUser
);

router.route("/social-auth").post(socialLoginOrRegister);
router.route("/mobile-auth").post(mobileLoginOrRegister);
router.route("/google-login").post(googleOAuthLogin);

export default router ;