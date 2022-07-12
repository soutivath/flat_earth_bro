import express from "express";
import authProfile from "../controllers/mix/authProfile.controller";
import paymentController from "../controllers/mix/payment.controller";
const router = express.Router();
const upload = require('multer')();
router.get("/currentProfile",authProfile.getCurrentProfile);
router.get("/onePayment/:id",paymentController.onePayment);
router.get("/payments",paymentController.payments);
router.get("/paymentRenting/:id",paymentController.paymentRenting);
router.get("/oneHeaderPayment/:id",paymentController.oneHeaderPayment);

export default router;