import Joi from "joi";

export const payTrashSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),
});
