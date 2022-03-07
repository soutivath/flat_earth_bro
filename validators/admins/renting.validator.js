import Joi from "joi";


export const checkInSchema = Joi.object({
    "room_id":Joi.number().integer().required(),
    "start_renting":Joi.date().greater(new Date).required(),
    "users_renting": Joi.array().items(Joi.number().integer()).required(),
    "months":Joi.number().integer().required(),
});

export const payRentSchema = Joi.object({
    "renting_detail_id":Joi.number().integer().required(),

});



export const checkOutSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),

});

export const removePeopleSchema = Joi.object({
    "renting_id":Joi.number().integer().required(),
    "users_renting": Joi.array().items(Joi.number().integer()).required(),
});

