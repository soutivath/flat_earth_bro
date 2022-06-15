import express from "express";
const router = express.Router();
const upload = require('multer')();
import auth from "../../controllers/admin/authentication.controller";

router.post("/login",upload.any(),auth.login);
router.post("/logout",upload.any(),auth.logout);
export default router;