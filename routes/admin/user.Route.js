import express from "express";
import user from "../../controllers/admin/user.controller";
import {profileUpload as uploader} from "../../middlewares/multer";

const router = express.Router();
// router.put("/editAdmin/:id",uploader.array("profile_image",1),user.editAdmin);
// router.post("/addAdmin",uploader.array("profile_image",1),user.addAdmin);
router.delete("/deleteUser/:id",user.deleteUser);
router.post("/addUser",user.addUser);
router.post("/logout",user.logout);

router.get("/user",user.getUser);


export default router;