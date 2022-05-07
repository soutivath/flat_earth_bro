import express from "express";
const router = express.Router();

import notification from "../../controllers/admin/notification.controller";

router.post("/notification",notification.sendNotification);
router.post("/allNotificaiton",notification.sendGlobalNotification);
export default router;
