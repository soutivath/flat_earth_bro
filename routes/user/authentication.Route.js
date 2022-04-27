import express from "express";
import auth from "../../controllers/user/authentication.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const router = express.Router();

router.post("/register",uploader.any("profile_image",1),auth.register);
router.post("/login",auth.login);

export default router;