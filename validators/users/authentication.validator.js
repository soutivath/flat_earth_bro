import Joi from "joi";

export const registerUserSchema = Joi.object({
    "phoneNumber":Joi.number().integer().required(),
    "password":Joi.number().integer().required(),
    "display_name":Joi.string(),

});

export const loginUserSchema = Joi.object({
    "phoneNumber":Joi.number().integer().required(),
    "password":Joi.number().integer().required()
});