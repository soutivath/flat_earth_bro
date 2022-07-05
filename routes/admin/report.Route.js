import express from "express";
import {contractUpload,proofOfPaymentUpload} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
import reportController from "../../controllers/admin/report.controller";
//router.post("/checkIn",upload.any(),renting.checkIn);

router.get("/renting",reportController.rentingNotPayReport);
router.get("/trash",reportController.trashReport);
router.get("/renting-pay",reportController.rentingPayReport);
router.get("/bill",reportController.billReport);
router.get("/contract",reportController.rentingReport);
router.get("/user",reportController.userReport);

export default router;



