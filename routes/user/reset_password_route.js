

import express from "express";
import passwordController from "../../controllers/user/password.controller";
const router = express.Router();
const upload = require('multer')();
router.post("/password-reset",upload.any(),passwordController.resetPassword);



export default router;