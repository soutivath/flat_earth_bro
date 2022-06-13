import express from "express";
import {contractUpload} from "../../middlewares/multer";
const router = express.Router();
import renting from "../../controllers/admin/renting.controller";
router.post("/checkIn",renting.checkIn);
router.post("/payRent",renting.payRent);
router.post("/addPeople",renting.addPeople);
router.post("/checkOut",renting.checkOut);
router.post("/removePeople",renting.removePeople);

//router.get('/one-renting/:id',renting.oneRenting);

router.get('/renting/:id',renting.oneRenting);
router.get("/renting",renting.getAllRenting);

router.get('/renting/detail/:id',renting.getRentingDetail);

router.get("/renting-detail",renting.getAllRentingDetail);

router.post("/add_contract/:id",(contractUpload.array("contract_image",1)),renting.addContract);

export default router;



