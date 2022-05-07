import Joi from "joi";


export const postUpdateSchema = Joi.object({
    "name":Joi.string().required(),
  
    "type_id":Joi.number().integer().required()
});

export const updateRoomUploadSchema = Joi.object({
    "name":Joi.string(),
  
    "type_id":Joi.number().integer(),
    "delete_image":Joi.array().items(Joi.string())
});
