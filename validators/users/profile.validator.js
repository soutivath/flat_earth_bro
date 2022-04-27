import Joi from "joi";

export const profileValidator = Joi.object({
    "name":Joi.string(),
});
