
import { sequelize, User ,Account,Notification,GlobalNotification} from "../../models";
import GLOBAL_TOPIC from "../../constants/notificationTopic";
import notificationUpdateSchema from "../../validators/users/notificationUpdate.validator";

import * as admin from "firebase-admin";
import createHttpError from "http-errors";
exports.getCurrentNotification = async (req,res,next) => {
    try{
        const notificationData = await Notification.findOne({
            where:{
                id:req.user.id
            },
            include:"users"
        });

        await Notification.update({
            is_read:1
        },{
            where:{
                user_id:req.user.id
            }
        });
        return res.status(200).json({
            message:"Get data successfully",
            data:notificationData,
            success:true
        });
    }catch(err){
        next(err);
    }
}
exports.getGlobalCurrentNotification = async (req,res,next) => {
    try{
        const notificationData = await GlobalNotification.findAll();
        return res.status(200).json({
            message:"Get data successfully",
            data:notificationData,
            success:true
        });
    }catch(err){
        next(err);
    }
}

exports.changeNotification = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validatedResult  = await notificationUpdateSchema.validateAsync(req.body);
        let account = await Account.findOne({
            where:{
               user_id:req.user.id
            },
        
        });
        if(!account){
           throw createHttpError.NotFound("Account not found");
        }
    
       if(validatedResult.personal_option!=account.personal_option){
           if(validatedResult.personal_option){
            await admin
            .messaging()
            .subscribeToTopic([validatedResult.firebaseFCM], account.notification_topic);
           }
           else{
            await admin
            .messaging()
            .unsubscribeFromTopic([validatedResult.firebaseFCM], account.notification_topic)
           }
       }
       if(validatedResult.global_option!=account.global_option){
           if(validatedResult.global_option){
            await admin
            .messaging()
            .subscribeToTopic(
              [validatedResult.firebaseFCM],
              GLOBAL_TOPIC.GLOBAL_TOPIC
            );
           }else{
            await admin
            .messaging()
            .unsubscribeFromTopic(
              [validatedResult.firebaseFCM],
              GLOBAL_TOPIC.GLOBAL_TOPIC
            );
           }
       }

       await Account.update({
           personal_option:validatedResult.personal_option,
           global_option:validatedResult.global_option
       },{
           where:{
               user_id:req.user.id
           },
           transaction:t
       });

        await t.commit();
        return res.status(200).json({
            message:"Data has been updated",
            data:[],
            success:true 
        })
    }catch(err){
        await t.rollback();
        next(err);
    }
}