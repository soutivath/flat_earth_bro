import Joi from "joi";

export const postEditAdminSchema = Joi.object({
    "name":Joi.string().required(),
    "surname":Joi.string().required(),
    "dob":Joi.date().required(),
    "phoneNumber":Joi.string().length(14).required(),
    "is_admin":Joi.string().valid(...Object.values(["user","admin","superadmin"])).required(),
    "personal_card_no":Joi.string().required()
    
    //"phoneNumber":Joi.string().min(6).length(8).required(),
  //  "password":Joi.string().required(),

});

export const addUserSchema = Joi.object({
    "name":Joi.string().required(),
    "surname":Joi.string().required(),
    "dob":Joi.date().required(),
  //  "password":Joi.string().required(),
    "phoneNumber":Joi.string().required(),
    "is_admin":Joi.string().valid(...Object.values(["user","admin","superadmin"])).required(),
    "personal_card_no":Joi.string().required()
});
export const adminAddUserSchema = Joi.object({
    "name":Joi.string().required(),
    "surname":Joi.string().required(),
    "dob":Joi.date().required(),
    "phoneNumber":Joi.string().required(),
});