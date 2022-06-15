import express from "express";
const router = express.Router();
import type from "../../controllers/admin/type.controller";
const upload = require('multer')();
router
.route("/type")
.get(type.index)
.post(upload.any(),type.post);

router
.route("/type/:id")
.get(type.show)
.put(upload.any(),type.update)
.delete(type.delete);

export default router;
