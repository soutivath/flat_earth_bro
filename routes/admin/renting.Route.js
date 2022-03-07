import express from "express";
const router = express.Router();
import renting from "../../controllers/admin/renting.controller";
router.post("/checkIn",renting.checkIn);
router.post("/payRentWithTrash",renting.payRentWithTrash);
router.post("payRentWithoutTrash",renting.payRentWithoutTrash);
router.post("/checkOut",renting.checkOut);
router.post("/removePeople",renting.removePeople);
export default router;