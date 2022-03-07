import express from "express";
import test from "../controllers/test.Controller";
import {updateRoomUpload} from "../middlewares/multer";
const router = express.Router();
router.post("/testMulter",updateRoomUpload.any("image_test",10),test.testMulter);

export default router;