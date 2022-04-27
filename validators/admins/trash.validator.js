import Joi from "joi";

export const payTrashSchema = Joi.object({
    "renting_detail_id":Joi.number().integer().required(),
    "pay_by":Joi.number().integer().required()
});
