import express from "express";
import renting from "../../controllers/user/renting.controller";
import {profileUpload as uploader} from "../../middlewares/multer";
const router = express.Router();
const upload = require('multer')();
router.get("/renting",renting.getCurrentRenting);
router.get("/all-renting",renting.getCurrentRenting);
router.get("/renting/:id",renting.getRentingDetail);
router.get('/status-renting/:id',renting.getRentingStatus);



router.get("/bill-by-renting/:id",renting.getBillByRenting);
router.get("/bill-by-id/:id",renting.getBillById);
router.get("/rentingdetail-by-renting/:id",renting.getRentingDetailByRenting);
router.get("/rentingdetail-by-id/:id",renting.getRentingDetailDetailById);
router.get("/trash-by-renting/:id",renting.getTrashByRenting);
router.get("/trash-by-id/:id",renting.getTrashById);
export default router;