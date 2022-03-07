import createHttpError from "http-errors";
import {sequelize,Renting,RentingDetails} from "../../models";
import date from 'date-and-time';
import {checkActiveRoom,checkExistingRenting} from "../helpers/rooms.helper";

import {checkInSchema,payRentSchema,checkOutSchema,removePeopleSchema} from "../../validators/admins/renting.validator"

exports.checkIn = async(req,res,next)=>{    
    const t = await sequelize.transaction();
    const now = new Date();
    const end_renting_date = date.addMonths(now,validateResult.months);
    try{
        const validateResult = await checkInSchema.validateAsync(req.body);
        const room = await checkActiveRoom (validateResult.room_id);
        if(room.active==false) return createHttpError.BadRequest("Room not active");
       // const rentingResult = await checkExistingRenting(validateResult.room_id,validateResult.user_id);
      //  if(rentingResult==null) //no renting detail - create new one
      //  {
             const renting = await Renting.create({
                 room_id:validateResult.room_id,
                 start_renting:now,
                 end_renting:end_renting_date,
                 is_active:1,
             });
            
             for(let i=0;i<=validateResult.month;i++){
                await RentingDetails.create({
                    renting_id:renting.id,
                    end_date:date.addMonths(now,i),
                    is_trash_pay:false,
                    is_renting_pay:true,
                });
             }
            for(let user_id of validateResult.users_renting )
            {
                await UserRenting.create({
                    user_id:user_id,
                    renting_id:renting.id,
                });
            }
            

       // }
      //  else{ // if renting it's exist
        /*    if(rentingResult.active==true){ // check if renting still active 
                createHttpError.BadRequest("This Renting Still Active try pay a rent not checkIn");
            }
           
            const renting = await Renting.update({
                end_renting:end_renting_date,
                is_active:1,
            },{
                where:{
                    id:rentingResult.id
                }
            },{
                transaction:t
            });
            for(let i=0;i<=validateResult.month;i++){
                await RentingDetails.create({
                    renting_id:renting.id,
                    end_date:date.addMonths(now,i),
                    is_trash_pay:false,
                    is_renting_pay:false,
                },{
                    transaction:t
                });
             }

             await UserRenting.destroy({
                 where:{
                     id:renting.id,
                 }
             });
             for(let user_id of validateResult.users_renting )
             {
                 await UserRenting.create({
                     user_id:user_id,
                     renting_id:renting.id,
                 });
             }
             
           

        }*/
        //roomId,userId
        return res.status(200).json({
            success: true,
        });

    } catch(err)
    {
        await t.rollback();
        next(err);
    }
}

exports.payRentWithTrash = async(req,res,next)=>{
    /**
     * 1. get renting id, renting detail id
     * 2. 
     */

    const t = await sequelize.transaction();
    const now = new Date();
    const end_renting_date = date.addMonths(now,validateResult.months);
    try{
        const validateResult = await payRentWithTrash.validateAsync(req.body);
        const renting_detail = await RentingDetails.findOne({
            where: {
                id:validateResult.renting_detail_id
            }
        });
        if(!renting_detail) return createHttpError.NotFound("No renting detail found");
        const renting = await Renting.findOne({
            where:{
                 id:renting_detail.renting_id
            }
        });
        await RentingDetails.update({
            is_trash_pay:true,
            is_renting_pay:true
        },{
            where:{
                id:renting_detail.id
            }
        });
        if(date.isSameDay(renting_detail.end_date,renting.end_renting_date)){
            for(let i = 0; i <=validateResult.months;i++){
                await RentingDetails.create({
                    renting_id:renting.id,
                    end_date:date.addMonths(now,i),
                    is_trash_pay:false,
                    is_renting_pay:false,
                });
            }
        }
       return res.status(200).json({
           "message":"pay rent successfully"
       });

    }catch(err) {
        await t.rollback();
        next(err);
    }

}
exports.payRentWithoutTrash = async(req,res,next)=>{
    const t = await sequelize.transaction();
    const now = new Date();
    const end_renting_date = date.addMonths(now,validateResult.months);
    try{
        const validateResult = await payRentSchema.validateAsync(req.body);
        const renting_detail = await RentingDetails.findOne({
            where: {
                id:validateResult.id
            }
        });
        if(!renting_detail) return createHttpError.NotFound("No renting detail found");
        const renting = await Renting.findOne({
            where:{
                 id:renting_detail.renting_id
            }
        });
        await RentingDetails.update({
            is_trash_pay:false,
            is_renting_pay:true
        },{
            where:{
                id:renting_detail.id
            }
        });
        if(date.isSameDay(renting_detail.end_date,renting.end_renting_date)){
            for(let i = 0; i <=validateResult.months;i++){
                await RentingDetails.create({
                    renting_id:renting.id,
                    end_date:date.addMonths(now,i),
                    is_trash_pay:false,
                    is_renting_pay:false,
                });
            }
        }
       return res.status(200).json({
           "message":"pay rent successfully"
       });

    }catch(err) {
        await t.rollback();
        next(err);
    }
}

exports.checkOut = async(req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validationResult = await checkOutSchema.validateAsync(req.body);
        const renting = await Renting.findOne({
            where:{
                id:validationResult.renting_id
            }
        });
        if(!renting) createHttpError.NotFound("Renting not found");
        const rentingUpdatedResult = await Renting.update({
            is_active:false,
        },{
            where:{
                id:validationResult.renting_id
            }
        });
        return res.status(200).json({
            data:rentingUpdatedResult,
            message:"Checkout comeplete",
            success:true
        });
    }catch(err) {
        await t.rollback();
        next(err);
    }
}

exports.removePeople = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validateResult = await removePeopleSchema.validateAsync(req.body);
        const renting = await Renting.findOne({
            where:{
                "id":validateResult.renting_id
            }
        });
        if(!renting) createHttpError.notFound("Renting not found");
        const deletedUsers =await UserRenting.destroy({
            where:{
                [Op.and]: [
                    { user_id:{[Sequelize.Op.in]: validateResult.user_id} },
                    { renting_id: validationResult.nextQuestion_id },
                  ],
            }
        },{
            transaction:t
        }
        );
        return res.status(200).json({
            success:true,
            message:"Remove people successfully",
            data:deletedUsers
        });
        
    }catch(err) {
        await t.rollback();
        next(err);
    }
}




