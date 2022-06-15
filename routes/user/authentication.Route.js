import express from "express";
import auth from "../../controllers/user/authentication.controller";
import {displayImageUpload as uploader} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
router.post("/register",[uploader.array("display_image",1)],auth.register);
router.post("/login",upload.any(),auth.login);

export default router;