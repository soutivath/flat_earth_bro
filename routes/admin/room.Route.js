import express from "express";
const router = express.Router();
import room from "../../controllers/admin/room.controller";
import {roomUpload,updateRoomUpload} from "../../middlewares/multer";
const upload = require('multer')();
router
.route("/room")
.post(roomUpload.array("room_images",10),room.post)
.get(room.index)

router.get("/roomWithType",room.roomsWithType);



router
.route("/room/:id")
.get(room.show)
.put(updateRoomUpload.array("room_images",10),room.update)
.delete(room.delete)
export default router;