import express from "express";
import profile from "../../controllers/user/profile.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const router = express.Router();

router.post("/editProfile",uploader.any("profile_image",1),profile.editProfile);
router.post("/resetPassword",profile.resetPassword);
router.post("/logout",profile.logout);

router.get("/profile",profile.getCurrentProfile);
export default router;