import {
  sequelize,
  User,
  GlobalNotification,
  Account,
  Notification,
} from "../../models";
import GLOBALTOPIC from "../../constants/notificationTopic";
import {
  sendNotificationSchema,
  sendAllNotificationSchema,
} from "../../validators/admins/notification.validator";
import createHttpError from "http-errors";
import date from "date-and-time";
var admin = require("firebase-admin");
exports.sendNotification = async (req, res, next) => {
  const t = await sequelize.transaction();
 
  try {
   
    const validationResult = await sendNotificationSchema.validateAsync(
      req.body
    );
  
    const now = date.format(new Date(), "YYYY-MM-DD");
   
    for (let eachUser of validationResult.user_id) {
      const user = await User.findOne(
        {
          where: {
            id: eachUser,
          },
          include: Account,
        },
        {
          transaction: t,
        }
      );
    
    
     

     if(!user) {
      throw createHttpError(404, "User not found");
     }
   

     let notification =  await Notification.create(
        {
          user_id: eachUser,
          message: validationResult.message,
          is_read: 0,
          date: now,
        },
        {
          transaction: t,
        }
      );
      

      if (user.Account.personal_option == true) {
        const message = {
          data: {
            id: notification.id.toString(),
            message: validationResult.message,
            route: "/private_notification_detail",
          },
          topic: user.Account.notification_topic,
        };

        admin
          .messaging()
          .send(message)
          .then((response) => {
            // Response is a message ID string.
            console.log("Successfully sent message:", response);
          })
          .catch((error) => {
            console.log("Error sending message:", error);
            throw createHttpError.InternalServerError("Can't send message");
          });
      }
    }

    await t.commit();

    return res.status(200).json({
      message: "send notification successfully",
      success: true,
      data: [],
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.sendGlobalNotification = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
 
    const validationResult = await sendAllNotificationSchema.validateAsync(
      req.body
    );

    let globalNotificaion = await GlobalNotification.create({
      title: validationResult.title,
      message: validationResult.message,
      detail: validationResult.detail,
    },{
      transaction:t
    });

    const message = {
      data: {
        message: validationResult.message,
        id: globalNotificaion.id.toString(),
        route: "/global_notification_detail",
      },
      topic: GLOBALTOPIC.GLOBAL_TOPIC,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
        throw createHttpError.InternalServerError("Can't send message");
      });
      await t.commit();
    return res.status(200).json({
      message: "send notification successfully",
      success: true,
      data: [],
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getAllNotification = async (req, res, next) => {
  try {
    const allNotification = await Notification.findAll({
      include: "users",
    });
    return res.status(200).json({
      data: allNotification,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.showNotification = async (req, res, next) => {
  try {
    const id = req.params.id;
    const notifiation = await Notification.findOne({
      where: {
        id: id,
      },
      include: "users",
    });
    return res.status(200).json({
      data: notifiation,
      message: "Get notification successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getNotificationByUser = async (req, res, next) => {
  try {
    const userID = req.params.id;
    const userWithNotification = await User.findOne({
      where: {
        id: userID,
      },
      include: "notification",
    });
    return res.status(200).json({
      data: userWithNotification,
      message: "Get Notification Successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllGlobalNotification = async (req, res, next) => {
  try {
    const globalNotification = await GlobalNotification.findAll();
    return res.status(200).json({
      data: globalNotification,
      message: "get all globalNotification",
      sccess: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification_id = req.params.id;
    await Notification.destroy({
      where: {
        id: notification_id,
      },
    });
    return res.status(200).json({
      data: [],
      message: "Delete notificaiton successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteGlobalNotification = async (req, res, next) => {
  try {
    const globalNotificaion_id = req.params.id;
    await GlobalNotification.destroy({
      where: {
        id: globalNotificaion_id,
      },
    });
    return res.status(200).json({
      data: [],
      message: "Delete notificaiton successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.showGlobalNotification = async (req, res, next) => {
  try {
    const id = req.params.id;
    const notifiation = await GlobalNotification.findOne({
      where: {
        id: id,
      },
    });
    return res.status(200).json({
      data: notifiation,
      message: "Get notification successfully",
    });
  } catch (err) {
    next(err);
  }
};
