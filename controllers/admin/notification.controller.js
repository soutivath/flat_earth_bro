import { sequelize,User } from "../../models";
import GLOBALTOPIC from "../../constants/notificationTopic";
import {sendNotificationSchema,sendAllNotificationSchema} from "../../validators/admins/notification.validator";
import createHttpError from "http-errors";

var admin = require("firebase-admin");
exports.sendNotification = async(req,res,next) => {
    const t = await sequelize.transaction();
try{
    const validationResult = await sendNotificationSchema.validateAsync(req.body);
    const user = await User.findByPk(validationResult.user_id);
    if(!user){
        throw createHttpError.NotFound("User not found try again");
    }
    const message = {
        data:{
            "message":validationResult.message
        },
        topic:user.notification_topic
    };
    admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
      throw createHttpError.InternalServerError("Can't send message");
    });
    return res.status(200).json({message:"send notification successfully",success:true,data:[]})
}catch(err){
    await t.rollback();
    next(err);
}
}

exports.sendGlobalNotification = async(req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validationResult = await sendAllNotificationSchema.validateAsync(req.body);
      
        const message = {
            data:{
                "message":validationResult.message
            },
            topic:GLOBALTOPIC.GLOBAL_TOPIC
        };
        admin.messaging().send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
          throw createHttpError.InternalServerError("Can't send message");
        });
        return res.status(200).json({message:"send notification successfully",success:true,data:[]})
    }catch(err){
        await t.rollback();
        next(err);
    }
}