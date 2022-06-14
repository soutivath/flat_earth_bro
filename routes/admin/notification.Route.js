import express from "express";
const router = express.Router();

import notification from "../../controllers/admin/notification.controller";


//router.get("/allNotificaiton",notification.allNotificaiton);

router.delete("/deleteGlobalNotification/:id",notification.deleteGlobalNotification);
router.delete("/deleteNotification/:id",notification.deleteNotification);
router.get("/getAllGlobalNotification",notification.getAllGlobalNotification);
router.get("/getNotificationByUser/:id",notification.getNotificationByUser);
router.get("/showNotification/:id",notification.showNotification);
router.get("/getAllNotification",notification.getAllNotification);
router.post("/sendGlobalNotification",notification.sendGlobalNotification);
router.post("/sendNotification",notification.sendNotification);
router.get("/showGlobalNotification/:id",notification.showGlobalNotification);

export default router;
