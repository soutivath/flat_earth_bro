import express from "express";
import setting from "../../controllers/admin/option.controller";
const router = express.Router();

router.post("setting",setting.editOption);
router.get("setting",setting.editOption);
router.get("setting/{id}",setting.showOption);

export default router;