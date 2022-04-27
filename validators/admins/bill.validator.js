import Joi from 'joi';

export const addBillSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),
    "price":Joi.number().integer().required(),
    "bill_type":Joi.string().valid('electric', 'water').required(),
});

export const updateBillSchema = Joi.object({
    "price":Joi.number().integer(),
    "bill_type":Joi.string().valid('electric', 'water'),
   
});

export const billOperateSchema = Joi.object({
    "pay_by":Joi.number().integer().required(),
});


