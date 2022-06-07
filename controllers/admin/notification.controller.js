import { sequelize, User ,GlobalNotification} from "../../models";
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

    const now  = date.format(new Date(),"YYYY-MM-DD");

    for (let eachUser of validationResult.user_id) {
      const user = await User.findOne({
          where:{
              id:eachUser
          },
          include:Account
      },{
          transaction:t
      });
      if (!user) {
        throw createHttpError.NotFound("User not found try again");
      }


      await Notification.create({
          user_id:eachUser,
          message:sendNotificationSchema.message,
          is_read:0,
          date:now,
      },{
          transaction:t
      });
      
    }

    for (let eachUser of validationResult.user_id) {
        const user = await User.findOne({
            where:{
                id:eachUser
            },
            include:Account
        },{
            transaction:t
        });

        if(user.Account.personal_option==true){
            const message = {
                data: {
                  message: validationResult.message,
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
        
    return res
      .status(200)
      .json({
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

    const message = {
      data: {
        message: validationResult.message,
      },
      topic: GLOBALTOPIC.GLOBAL_TOPIC,
    };

    await GlobalNotification.create({
        message:sendAllNotificationSchema.message
    });
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

      
    return res
      .status(200)
      .json({
        message: "send notification successfully",
        success: true,
        data: [],
      });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
