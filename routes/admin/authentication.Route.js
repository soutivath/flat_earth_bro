import express from "express";
const router = express.Router();

import auth from "../../controllers/admin/authentication.controller";

router.post("/login",auth.login);
router.post("/logout",auth.logout);
export default router;