import createHttpError from "http-errors";
import {
  sequelize,
  Renting,
  RentingDetail,
  Room,
  UserRenting,
  Type,
  User,
  Bill,
} from "../../models";
import date from "date-and-time";
import { checkActiveRoom, checkExistingRenting } from "../helpers/rooms.helper";
import { getTrashPrice } from "../../constants/price";
import {
  checkInSchema,
  payRentSchema,
  checkOutSchema,
  removePeopleSchema,
} from "../../validators/admins/renting.validator";
import { Op } from "sequelize";
import { Bills } from "../../tranformer/bill.tranformer";

exports.checkIn = async (req, res, next) => {
  const t = await sequelize.transaction();
  const now = new Date();

  try {
    const validateResult = await checkInSchema.validateAsync(req.body);

    const end_renting_date = date.addMonths(now, validateResult.months);

    let room = await Room.findOne({
      where: { id: validateResult.room_id },
    });
    if (!room) {
      throw createHttpError(404, "Room not found");
    }

    //   if(room.checkActive()){
    //       throw createHttpError(400, "Room is active try to get another room");
    //   }

    const renting = await Renting.create(
      {
        room_id: validateResult.room_id,
        start_renting_date: now,
        end_renting_date: end_renting_date,
        is_active: 1,
        deposit: validateResult.deposit,
      },
      {
        transaction: t,
      }
    );

    for (let i = 1; i <= validateResult.months; i++) {
      await RentingDetail.create(
        {
          renting_id: renting.id,
          end_date: date.addMonths(now, i),
          is_trash_pay: false,
          is_renting_pay: false,
          trash_pay_amount: 0,
          renting_pay_amount: 0,
        },
        {
          transaction: t,
        }
      );
    }
    for (let user_id of validateResult.users_renting) {
      await UserRenting.create(
        {
          user_id: user_id,
          renting_id: renting.id,
        },
        {
          transaction: t,
        }
      );
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
    await Room.update(
      {
        is_active: true,
      },
      {
        where: {
          id: room.id,
        },
        transaction: t,
      }
    );

    await t.commit();
    return res.status(200).json({
      success: true,
      data: renting,
      message: "Checking in successfully",
    });
  } catch (err) {
    await t.rollback();

    next(err);
  }
};

exports.payRent = async (req, res, next) => {
  /**
   * 1. get renting id, renting detail id
   * 2.
   */

  const t = await sequelize.transaction();
  const now = new Date();

  try {
    const validateResult = await payRentSchema.validateAsync(req.body);
    const end_renting_date = date.addMonths(now, validateResult.months);

    const renting_detail = await RentingDetail.findOne({
      where: {
        id: validateResult.renting_detail_id,
      },
    });

    if (!renting_detail)
      throw createHttpError.NotFound("No renting detail found");
    if (renting_detail.is_renting_pay == true)
      throw createHttpError(400, "This bill already paid");

    const renting = await Renting.findOne({
      where: {
        id: renting_detail.renting_id,
      },
      include: [
        {
          model: Room,
          include: Type,
        },
      ],
    });

    const roomPrice = renting.Room.Type.price;
    const amountOfPeople = await UserRenting.count({
      where: {
        renting_id: renting.id,
      },
    });
    let allTrashPrice = 0;

    if (validateResult.renting_pay) {
      const isUserExisting = await User.findOne({
        where: {
          id: validateResult.renting_pay_id,
        },
      });
      if (!isUserExisting) {
        throw createHttpError(404, "User not found");
      }
    }
    if (validateResult.trash_pay_option) {
      allTrashPrice = getTrashPrice() * amountOfPeople;
    }

    await RentingDetail.update(
      {
        is_trash_pay: validateResult.trash_pay_option,
        is_renting_pay: true,
        renting_pay_amount: roomPrice,
        trash_pay_amount: allTrashPrice,
        renting_pay_by: validateResult.renting_pay,
        trash_pay_by: validateResult.trash_pay_option
          ? validateResult.renting_pay
          : null,
      },
      {
        where: {
          id: renting_detail.id,
        },
        transaction: t,
      }
    );
    if (date.isSameDay(renting_detail.end_date, renting.end_renting_date)) {
      for (let i = 1; i <= validateResult.months; i++) {
        await RentingDetail.create(
          {
            renting_id: renting.id,
            end_date: date.addMonths(now, i),
            is_trash_pay: false,
            is_renting_pay: false,
          },
          {
            transaction: t,
          }
        );
      }
      await Renting.update(
        {
          end_renting_date: end_renting_date,
        },
        {
          where: {
            id: renting.id,
          },
          transaction: t,
        }
      );
    }

    await t.commit();
    return res.status(200).json({
      message: "pay rent successfully",
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
// exports.payRentWithoutTrash = async(req,res,next)=>{
//     const t = await sequelize.transaction();
//     const now = new Date();
//     const end_renting_date = date.addMonths(now,validateResult.months);
//     try{
//         const validateResult = await payRentSchema.validateAsync(req.body);
//         const renting_detail = await RentingDetail.findOne({
//             where: {
//                 id:validateResult.id
//             }
//         });
//         if(!renting_detail) return createHttpError.NotFound("No renting detail found");
//         const renting = await Renting.findOne({
//             where:{
//                  id:renting_detail.renting_id
//             }
//         });
//         await RentingDetail.update({
//             is_trash_pay:false,
//             is_renting_pay:true
//         },{
//             where:{
//                 id:renting_detail.id
//             }
//         });
//         if(date.isSameDay(renting_detail.end_date,renting.end_renting_date)){
//             for(let i = 0; i <=validateResult.months;i++){
//                 await RentingDetail.create({
//                     renting_id:renting.id,
//                     end_date:date.addMonths(now,i),
//                     is_trash_pay:false,
//                     is_renting_pay:false,
//                 });
//             }
//         }
//        return res.status(200).json({
//            "message":"pay rent successfully"
//        });

//     }catch(err) {
//         await t.rollback();
//         next(err);
//     }
// }

exports.checkOut = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const validationResult = await checkOutSchema.validateAsync(req.body);
    const renting = await Renting.findOne({
      where: {
        id: validationResult.renting_id,
      },
    });
    if (!renting) createHttpError.NotFound("Renting not found");
    if (validationResult.bypass_checkout) {
      const checkNotPayRecord = await RentingDetail.findAll({
        where: {
          [Op.or]: [
            {
              is_trash_pay: false,
            },
            { is_renting_pay: false },
          ],
        },
      });
      if (
        typeof checkNotPayRecord !== "undefined" &&
        checkNotPayRecord.length > 0
      ) {
        throw createHttpError(
          400,
          "Due bypass check option you need to make a payment before checkout"
        );
      }
    }
    await Renting.update(
      {
        is_active: false,
      },
      {
        where: {
          id: validationResult.renting_id,
        },
        transaction: t,
      }
    );
    await t.commit();
    return res.status(200).json({
      data: renting,
      message: "Checkout comeplete",
      success: true,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.removePeople = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const validateResult = await removePeopleSchema.validateAsync(req.body);
    const renting = await Renting.findOne({
      where: {
        id: validateResult.renting_id,
      },
    });
    if (!renting) createHttpError(404, "Renting not found");

    const checkRecordIsExist = await UserRenting.findAll({
      where: {
        [Op.and]: [
          { user_id: { [Op.in]: validateResult.users_renting } },
          { renting_id: validateResult.renting_id },
        ],
      },
    });

    if (
      typeof checkRecordIsExist !== "undefined" &&
      checkRecordIsExist.length <= 0
    ) {
      throw createHttpError(400, "User not found in the record");
    }

    const deletedUsers = await UserRenting.destroy(
      {
        where: {
          [Op.and]: [
            { user_id: { [Op.in]: validateResult.users_renting } },
            { renting_id: validateResult.renting_id },
          ],
        },
      },
      {
        transaction: t,
      }
    );
    await t.commit();
    return res.status(200).json({
      success: true,
      message: "Remove people successfully",
      data: checkRecordIsExist,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.addPeople = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const validateResult = await removePeopleSchema.validateAsync(req.body);
    const renting = await Renting.findOne({
      where: {
        id: validateResult.renting_id,
      },
    });
    if (!renting) createHttpError(404, "Renting not found");

    const checkRecordIsExist = await UserRenting.findAll({
      where: {
        [Op.and]: [
          { user_id: { [Op.in]: validateResult.users_renting } },
          { renting_id: validateResult.renting_id },
        ],
      },
    });

    if (
      typeof checkRecordIsExist !== "undefined" &&
      checkRecordIsExist.length > 0
    ) {
      throw createHttpError(400, "Some user already been in record");
    }
    for (let userId of validateResult.users_renting) {
      await UserRenting.create(
        {
          user_id: userId,
          renting_id: validateResult.renting_id,
        },
        {
          transaction: t,
        }
      );
    }

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "add people successfully",
      data: checkRecordIsExist,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getAllRenting = async (req, res, next) => {
  try {
    
    let allRentingData = await Renting.findAll({
      plain: true,
      include: [Bill, Room],
    });
    // allRentingData = JSON.stringify(allRentingData);
    // allRentingData = JSON.parse(allRentingData);
    // let billTranform = bills(allRentingData.Bills);
    // allRentingData.Bills = billTranform;
    return res.status(200).json({
      data: allRentingData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.oneRenting = async (req, res, next) => {
  
  try {

    let renting_id = req.params.id;
    const rentingData = await Renting.findOne({
      where: {
        id: renting_id,
      },
      include: [Room,RentingDetail],
    });
    return res.status(200).json({
      data: rentingData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRentingDetail = async (req, res, next) => {
 
  try{
    const renting_detail_id = req.params.id;
  
    const rentingDetailData = await RentingDetail.findOne({
      where: {
        id:renting_detail_id
      },
      include:["trash_pay","renting_pay"]
     
     
    });
    return res.status(200).json({
      data: rentingDetailData,
      message: "get data successfully",
      success: true,
    });
  }catch(err){
    next(err);
  }
};

exports.getAllRentingDetail = async (req,res,next)=>{
  try{
    let option = [];
    if(req.query.isTrashPay==="true"){
      option.push({"is_trash_pay":true})
      //option.is_trash_pay =true;
    }
    if(req.query.isTrashPay==="false"){
     // option.is_trash_pay =false;
     option.push({"is_trash_pay":false})
    }
    if(req.query.isRentingPay==="true"){
     // option.is_renting_pay =true;
      option.push({"is_renting_pay":true})
    }
    if(req.query.isRentingPay==="false"){
      option.push({"is_renting_pay":false})
    //  option.is_renting_pay =false;
    }
 
    let rentingDetailData = await RentingDetail.findAll({
      where:{
        [Op.and]:option
      },
      include:["trash_pay","renting_pay"]
    });
    return res.status(200).json({
      data:rentingDetailData,
      message:"get data successfully",
      success: true,
    });
  }catch(err){
    next(err);
  }
}