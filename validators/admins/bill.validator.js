import Joi from 'joi';

export const addBillSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),
    "price":Joi.number().integer().required(),
    "bill_type":Joi.string().valid('fire', 'water'),
});

export const billOperateSchema = Joi.object({
    "bill_id":Joi.number().integer().required(),
});


