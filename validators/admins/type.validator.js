import Joi from "joi";

export const postUpdateSchema = Joi.object({
    "name":Joi.string().required(),
    "price":Joi.number().integer().required()
});

