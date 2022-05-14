

import express from "express";
import passwordController from "../../controllers/user/password.controller";
const router = express.Router();

router.post("/password-reset",passwordController.resetPassword);



export default router;