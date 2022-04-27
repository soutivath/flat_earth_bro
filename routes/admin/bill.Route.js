import express from "express";
const router = express.Router();

import bill from "../../controllers/admin/bill.controller";
import {billUpload} from "../../middlewares/multer";

router.route("/bill").post([billUpload.array("bill_image",1)],bill.addBill);
router.route("/bill/:id").put([billUpload.array("bill_image",1)],bill.updateBill).delete(bill.deleteBill);
router.post("/bill/pay/:id", bill.payBill);

router.get("/bill",bill.getAll);
router.get("/bill/renting/:id",bill.getByRenting);
router.get("/bill/:id",bill.getOne);
export default router;