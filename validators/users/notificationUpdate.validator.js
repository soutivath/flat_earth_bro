import Joi from "joi";

export default Joi.object({
    
    "personal_option":Joi.boolean().required(),
    "global_option":Joi.boolean().required(),
    "firebaseFCM":Joi.string().required()
});