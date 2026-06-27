import { Router } from "express";
import {
    sendMessage,
    getChatMessages,
    getChatConnections
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply authentication to all chat endpoints

router.route("/send").post(
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]),
    sendMessage
);

router.route("/history/:userId").get(getChatMessages);
router.route("/connections").get(getChatConnections);

export default router;
