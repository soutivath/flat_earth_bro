import express from "express";
import user from "../../controllers/admin/user.controller";
import {profileUpload as uploader} from "../../middlewares/multer";

const router = express.Router();
router.post("/editAdmin",user.editAdmin);
router.post("/addAdmin",user.addAdmin);
router.post("/deleteUser",user.deleteUser);
router.post("/addUser",user.addUser);
router.post("/logout",user.logout);
export default router;