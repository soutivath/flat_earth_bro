import express from "express";
import user from "../../controllers/admin/user.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
import setting from "../../controllers/admin/option.controller";
const upload = require('multer')();
const router = express.Router();
// router.put("/editAdmin/:id",uploader.array("profile_image",1),user.editAdmin);
// router.post("/addAdmin",uploader.array("profile_image",1),user.addAdmin);
router.delete("/deleteUser/:id",user.deleteUser);
router.post("/addUser",upload.any(),user.addUser);
router.post("/logout",upload.any(),user.logout);

router.get("/user",user.getUser);

router.get("/setting",setting.getOption);
router.get("/setting/:id",setting.showOption);

export default router;