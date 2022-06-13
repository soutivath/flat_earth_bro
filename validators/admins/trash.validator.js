import Joi from "joi";

export const payTrashSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),
    "trash_pay_id":Joi.array().items(Joi.number().integer()).required(),
    "pay_by":Joi.number().integer().required()
});
