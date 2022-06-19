import express from "express";
import setting from "../../controllers/admin/option.controller";
const router = express.Router();
const upload = require('multer')();
router.put("/setting/:id",upload.any(),setting.editOption);
router.post("/setting",upload.any(),setting.addOption);

router.delete("/setting/:id",setting.deleteOption);

export default router;