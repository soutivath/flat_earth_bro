import express from "express";
import setting from "../../controllers/admin/option.controller";
const router = express.Router();

router.put("/setting/:id",setting.editOption);
router.post("/setting",setting.addOption);
router.get("/setting",setting.getOption);
router.get("/setting/:id",setting.showOption);
router.delete("/setting/:id",setting.deleteOption);

export default router;