import Joi from "joi";

export const postEditAdminSchema = Joi.object({
    "name":Joi.string().required(),
    //"phoneNumber":Joi.string().min(6).length(8).required(),
  //  "password":Joi.string().required(),
});

export const addUserSchema = Joi.object({
    "name":Joi.string().required(),
    "password":Joi.string().required(),
    "phoneNumber":Joi.number().integer().required(),
});