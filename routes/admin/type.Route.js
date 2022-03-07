import express from "express";
const router = express.Router();
import type from "../../controllers/admin/type.controller";

router
.route("/type")
.get(type.index)
.post(type.post);

router
.route("/type/:id")
.get(type.show)
.put(type.update)
.delete(type.delete);

export default router;
