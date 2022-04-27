import Joi from "joi";


export const postUpdateSchema = Joi.object({
    "name":Joi.string().required(),
    "price":Joi.number().integer().required(),
    "type_id":Joi.number().integer().required()
});

export const updateRoomUploadSchema = Joi.object({
    "name":Joi.string().required(),
    "price":Joi.number().integer().required(),
    "type_id":Joi.number().integer().required(),
    "delete_image":Joi.array().items(Joi.string())
});
