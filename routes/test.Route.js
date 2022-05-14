import express from "express";
import test from "../controllers/test.Controller";
const router = express.Router();
router.post("/testMulter",test.testMulter);

export default router;