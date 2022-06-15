import express from "express";
import {contractUpload} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
import renting from "../../controllers/admin/renting.controller";
router.post("/checkIn",upload.any(),renting.checkIn);
router.post("/payRent",upload.any(),renting.payRent);
router.post("/addPeople",upload.any(),renting.addPeople);
router.post("/checkOut",upload.any(),renting.checkOut);
router.post("/removePeople",upload.any(),renting.removePeople);

//router.get('/one-renting/:id',renting.oneRenting);

router.get('/renting/:id',renting.oneRenting);
router.get("/renting",renting.getAllRenting);

router.get('/renting/detail/:id',renting.getRentingDetail);

router.get("/renting-detail",renting.getAllRentingDetail);

router.post("/add_contract/:id",(contractUpload.array("contract_image",1)),renting.addContract);

export default router;



