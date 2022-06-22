import Joi from "joi";

export const registerUserSchema = Joi.object({
    "phoneNumber":Joi.number().integer().required(),
    "password":Joi.string().required(),
    "display_name":Joi.string().required(),
    "firebaseToken":Joi.string().required(),
    "firebaseFCM":Joi.string().required()
});

export const loginUserSchema = Joi.object({
    "phoneNumber":Joi.number().integer().required(),
    "password":Joi.string().required()
});
export const loginFCMUserSchema = Joi.object({
    "phoneNumber":Joi.number().integer().required(),
    "password":Joi.string().required(),
   
});