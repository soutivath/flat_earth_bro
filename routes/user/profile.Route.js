import express from "express";
import profile from "../../controllers/user/profile.controller";

const router = express.Router();

router.post("/editProfile",profile.editProfile);
router.post("/resetPassword",profile.resetPassword);
router.post("/logout",profile.logout);

export default router;