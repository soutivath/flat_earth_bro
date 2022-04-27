import express from "express";
import renting from "../../controllers/user/renting.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const router = express.Router();

router.get("/renting",renting.getCurrentRenting);
router.get("/all-renting",renting.getCurrentRenting);
router.get("/renting/:id",renting.getRentingDetail);


export default router;