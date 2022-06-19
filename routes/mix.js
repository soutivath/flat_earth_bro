import express from "express";
import authProfile from "../controllers/mix/authProfile.controller";
import paymentController from "../controllers/mix/payment.controller";
const router = express.Router();
const upload = require('multer')();
router.get("/currentProfile",authProfile.getCurrentProfile);
router.get("/onePayment/:id",paymentController.onePayment);
router.get("/payments",paymentController.payments);

export default router;