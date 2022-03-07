import Joi from "joi";

export const sendNotificationSchema = Joi.object({
    "message":Joi.string().required(),
    "user_id":Joi.number().integer().required(),
});
export const sendAllNotificationSchema = Joi.object({
    "message":Joi.string().required(),
   
});