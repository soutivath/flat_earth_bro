import express from "express";
const router = express.Router();
const upload = require('multer')();
import trash from "../../controllers/admin/trash.controllers";
router.post("/payTrash",upload.any(),trash.payTrash);

export default router;
