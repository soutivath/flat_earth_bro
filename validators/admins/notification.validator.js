import Joi from "joi";

export const sendNotificationSchema = Joi.object({
    "message":Joi.string().required(),
    "user_id":Joi.array().items(Joi.number().integer()).required(),
});
export const sendAllNotificationSchema = Joi.object({
    "title":Joi.string().required(),
    "message":Joi.string().required(),
    "detail":Joi.string().required()
   
});