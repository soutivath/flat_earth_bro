import Joi from "joi";
import date from "date-and-time";
export const checkInSchema = Joi.object({
  room_id: Joi.number().integer().required(),
  start_renting:Joi.date().greater(new Date()).required(),
  users_renting: Joi.array().items(Joi.number().integer()).required(),
  renting_pay_by: Joi.number().integer().required(),

  renting_pay: Joi.boolean().required(),
  trash_pay: Joi.boolean().required(),

  renting_months: Joi.number().integer().required(),
  trash_months: Joi.number().integer().required(),
  deposit: Joi.number().integer().required(),

});

export const payRentSchema = Joi.object({
  renting_pay: Joi.array().items(
    Joi.object({
      renting_detail_id:Joi.number().integer().required(),
      trash_pay:Joi.boolean().required(),
      renting_pay:Joi.boolean().required(),
      fine:Joi.number().integer().required()
    })
  ).required(),
  renting_id:Joi.number().integer(),
  //trash_pay_option: Joi.boolean().required(),
  //  "months":Joi.number().integer().required(),
  renting_months: Joi.number().integer().required(),
  trash_months: Joi.number().integer().required(),
  renting_pay_by: Joi.number().integer().required(),
//  renting_fine: Joi.number().integer().required(),
});

export const checkOutSchema = Joi.object({
  renting_id: Joi.number().integer().required(),
  bypass_checkout: Joi.boolean().required(),
  renting_pay_by:Joi.number().integer(),
  pay_last_renting:Joi.boolean(),
  amount:Joi.number().integer(),
  fine:Joi.number().integer(),

  
});

export const removePeopleSchema = Joi.object({
  renting_id: Joi.number().integer().required(),
  users_renting: Joi.array().items(Joi.number().integer()).required(),
});
