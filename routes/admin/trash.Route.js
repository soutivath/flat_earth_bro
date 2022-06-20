import express from "express";
const router = express.Router();
const upload = require('multer')();
import trash from "../../controllers/admin/trash.controllers";
router.post("/payTrash",upload.any(),trash.payTrash);
router.get('/trash/:id',trash.getTrashDataFromRenting);
router.get('/one-trash/:id',trash.oneTrash);
export default router;
