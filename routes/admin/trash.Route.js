import express from "express";
const router = express.Router();
import trash from "../../controllers/admin/trash.controllers";
router.post("/payTrash",trash.payTrash);

export default router;
