
import { sequelize, User ,Notification} from "../../models";
import GLOBAL_TOPIC from "../../constants/notificationTopic";
import notificationUpdateSchema from "../../validators/users/notificationUpdate.validator";
import notification from "../../models/notification";
import * as admin from "firebase-admin";
exports.getCurrentNotificationSetting = async (req,res,next) => {
    try{
        const notificationData = await Notification.findOne({
            where:{
                id:req.user.id
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

exports.updateCurrentNotificationSetting = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validatedResult  = await notificationUpdateSchema.validateAsync(req.body);
        let userWitNotificationData = await User.findOne({
            where:{
                id:req.user.id
            },
            include:Notification
        });
        if(!userWitNotificationData){
            await t.rollback();
            return res.status(404).json({
                message:"Data not found",
                data:[],
                success:false 
            })
        }
    
       if(validatedResult.personal_option!=notificationData.personal_option){
           if(validatedResult.personal_option){
            await admin
            .messaging()
            .subscribeToTopic([validatedResult.firebaseFCM], user.notification_topic);
           }
           else{
            await admin
            .messaging()
            .unsubscribeFromTopic([validatedResult.firebaseFCM], user.notification_topic)
           }
       }
       if(validatedResult.global_option!=notification.global_option){
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

       await Notification.update({
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