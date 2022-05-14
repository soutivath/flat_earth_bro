import express from "express";
import noticationController from "../../controllers/user/notification_option.controller";

const router = express.Router();

router.post("notification",noticationController.updateCurrentNotificationSetting);

router.get('notification',noticationController.getCurrentNotificationSetting);

export default router;