import express from "express";
const router = express.Router();

import bill from "../../controllers/admin/bill.controller";

router.route("/bill").post(bill.addBill).put(bill.updateBill).delete(bill.deleteBill);
router.post("/bill/pay/:id", bill.payBill);
export default router;