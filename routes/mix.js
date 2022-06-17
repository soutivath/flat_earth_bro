import express from "express";
import authProfile from "../controllers/mix/authProfile.controller";
const router = express.Router();
const upload = require('multer')();
router.get("/currentProfile",authProfile.getCurrentProfile);


export default router;