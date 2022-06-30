import express from "express";
import renting from "../../controllers/user/renting.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
router.get("/renting",renting.getCurrentRenting);
router.get("/all-renting",renting.getCurrentRenting);
router.get("/renting/:id",renting.getRentingDetail);
router.get('/status-renting/:id',renting.getRentingStatus);

export default router;