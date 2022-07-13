import express from "express";
import noticationController from "../../controllers/user/notification_option.controller";

const router = express.Router();
const upload = require('multer')();
router.get("/notification",noticationController.getCurrentNotification);

router.get('/global-notification',noticationController.getGlobalCurrentNotification);
router.post('/notification-setting',upload.any(),noticationController.changeNotification);

router.get('/getOneNotification/:id',noticationController.getOneNotification);
router.get('/getOneGlobalNotification/:id',noticationController.getOneGlobalNotification);
export default router;