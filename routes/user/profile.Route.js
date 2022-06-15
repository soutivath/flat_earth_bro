import express from "express";
import profile from "../../controllers/user/profile.controller";
import {displayImageUpload as uploader} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
router.post("/editProfile",uploader.array("display_image",1),profile.editProfile);

router.post("/logout",profile.logout);

router.get("/profile",profile.getCurrentProfile);
export default router;