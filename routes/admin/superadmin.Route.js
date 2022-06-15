import express from "express";
import superadmin from "../../controllers/admin/superadmin.user.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const upload = require('multer')();
const router = express.Router();
router.put("/editAdmin/:id",uploader.array("profile_image",1),superadmin.editUser);
router.post("/addAdmin",uploader.array("profile_image",1),superadmin.addAdmin);
router.delete("/deleteUser/:id",superadmin.deleteUser);
// router.post("/addUser",superadmin.addUser);
router.get('/nice',(req,res,next)=>{
    return res.status(200).json({data:'nice'});
})
router.get("/user",superadmin.getUser);


export default router;