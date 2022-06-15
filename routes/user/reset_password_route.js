

import express from "express";
import passwordController from "../../controllers/user/password.controller";
const router = express.Router();
const upload = require('multer')();
router.post("/password-reset",passwordController.resetPassword);



export default router;