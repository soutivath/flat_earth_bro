import createHttpError from "http-errors";
import moment from "moment";
import {
  sequelize,
  Renting,
  RentingDetail,
  Room,
  UserRenting,
  Type,
  User,
  Bill,
  Setting,
  Trash,
  Payment,
  PaymentDetail,
} from "../../models";

import payment_detail_enum from "../../constants/payment_detail";

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
import paidType from "../../constants/paidType";
import payment_detail from "../../constants/payment_detail";

exports.checkIn = async (req, res, next) => {
  const t = await sequelize.transaction();
  const now = new Date();
  try {
    const validateResult = await checkInSchema.validateAsync(req.body);
    let totalPrice = 0;

    const end_renting_date = date.addMonths(now, validateResult.months);

    let room = await Room.findOne({
      where: { id: validateResult.room_id },
      include: Type,
    });
    if (!room) {
      throw createHttpError(404, "Room not found");
    }

    if (room.is_active) {
      throw createHttpError(400, "Room is not available for renting");
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
        staff_id: req.User.user_id,
        user_id: validateResult.renting_pay_by,
      },
      {
        transaction: t,
      }
    );

    if (validateResult.renting_pay) {
      rentingDetailOption.renting_pay_amount = room.Type.price;
      if (validateResult.renting_pay_by) {
        const user = await User.findByPk(validateResult.renting_pay_by);
        if (!user) {
          throw createHttpError(404, "user not found");
        }
        rentingDetailOption.renting_pay_by = validateResult.renting_pay_by;
      } else {
        throw createHttpError(422, "Please provide a user id");
      }
    } else {
      rentingDetailOption.renting_pay_amount = 0;
    }

    let trash_settings = await Setting.findOne({
      where: {
        name: "trash_price",
      },
    });

    let trash_price = trash_settings.value;

    let payment = await Payment.create({
      pay_by: validateResult.renting_pay_by,
      renting_id: renting,
      operate_by: req.user.user_id,
      pay_date: new Date(),
    });
    let payment_no = payment.toString().padStart(10, "0");

    let rentingDetailOption = {
      renting_id: renting.id,
      is_trash_pay: paidType.UNPAID,
      is_renting_pay:
        validateResult.renting_pay == true ? paidType.PAID : paidType.UNPAID,
      // trash_pay_amount: 0,
    };

    for (let i = 0; i <= validateResult.renting_months; i++) {
      if (i == validateResult.renting_months) {
        let rentingID = await RentingDetail.create(
          {
            end_date: date.addMonths(now, i),
            renting_id: renting.id,
            is_trash_pay: paidType.UNPAID,
            is_renting_pay: paidType.UNPAID,
            trash_pay_amount: 0,
          },
          {
            transaction: t,
          }
        );

        await Trash.create(
          {
            renting_detail_id: rentingID,
            is_trash_pay: paidType.UNPAID,
          },
          {
            transaction: t,
          }
        );
      } else {
        let rentingID = await RentingDetail.create(
          {
            end_date: date.addMonths(now, i),
            ...rentingDetailOption,
          },
          {
            transaction: t,
          }
        );

        if (
          validateResult.trash_months <= validateResult.renting_months &&
          validateResult.trash_months != 0
        ) {
          await Trash.create(
            {
              renting_detail_id: rentingID,
              is_trash_pay: paidType.PAID,
              trash_pay_amount: trash_price,
              proof_of_payment: null,
            },
            {
              transaction: t,
            }
          );
        } else {
          await Trash.create(
            {
              renting_detail_id: rentingID,
              is_trash_pay: paidType.UNPAID,
              trash_pay_amount: trash_price,
              proof_of_payment: null,
            },
            {
              transaction: t,
            }
          );
        }
      }
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

  try {
    const validateResult = await payRentSchema.validateAsync(req.body);
    //.................
    let renting_id = "";
    let renting_end_date = "";
    let months = validateResult.renting_months;

    for (let eachRenitngDetail of validateResult.renting_pay) {
      const renting_detail = await RentingDetail.findOne({
        where: {
          id: eachRenitngDetail.renting_detail_id,
        },
        include: [Renting, Trash],
      });
      renting_id = renting_detail.renting_id;

      if (!renting_detail)
        throw createHttpError.NotFound("No renting detail found");

      if (renting_detail.is_renting_pay == paidType.PAID)
        throw createHttpError(400, "This bill already paid");

      if (
        eachRenitngDetail.trash_pay == true &&
        renting_detail.Trash.is_trash_pay == paidType.PAID
      ) {
        throw createHttpError(
          400,
          "Something went wrong some records of trash price has already paid"
        );
      }

      if (
        eachRenitngDetail.renting_pay == true &&
        renting_detail.is_renting_pay == paidType.PAID
      ) {
        throw createHttpError(
          400,
          "Something went wrong some records of renting price has already paid"
        );
      }
    }

    //....................

    const renting = await Renting.findOne({
      where: {
        id: renting_id,
      },
      include: [
        {
          model: Room,
          include: Type,
        },
      ],
    });

    renting_end_date = renting.end_date;

    if (renting.active == 0) {
      throw createHttpError(400, "this renting is already checkout");
    }

    const roomPrice = renting.Room.Type.price;
    if (validateResult.renting_pay_by) {
      const isUserExisting = await User.findOne({
        where: {
          id: validateResult.renting_pay_by,
        },
      });
      if (!isUserExisting) {
        throw createHttpError(404, "User not found");
      }
    }

    // let allTrashPrice = 0;
    // if (validateResult.trash_pay_option) {
    //   const amountOfPeople = await UserRenting.count({
    //     where: {
    //       renting_id: renting.id,
    //     },
    //   });

    //   const trash_price = await Setting.findOne({
    //     where: {
    //       name: "trash_price",
    //     },
    //   });
    //   //allTrashPrice = getTrashPrice() * amountOfPeople;
    //   allTrashPrice = parseInt(trash_price) * amountOfPeople;
    // }

    const trash = await Setting.findOne({
      where: {
        name: "trash_price",
      },
    });
    const allTrashPrice = trash.value;

    //fine
    // let fine = 0;
    // if (validateResult.renting_fine) {
    //   const finePrice = await Setting.findOne({
    //     where: {
    //       name: "fine",
    //     },
    //   });
    //   let now = new Date();
    //   let endDate = new Date(renting_detail.end_date);
    //   let result = differenceInDays(now, endDate);
    //   if (result > 0) {
    //     fine = parseInt(finePrice) * result;
    //   }
    // }
    //end fine

    let payment = await Payment.create({
      pay_by: validateResult.renting_pay_by,
      renting_id: renting,
      operate_by: req.user.user_id,
      pay_date: new Date(),
    });
    let payment_no = payment.toString().padStart(10, "0");

    //update renting
    for (let eachRentingDetail of validateResult.renting_pay) {
      if (eachRentingDetail.renting_pay) {
        let updatingRentingDetail = await findOne({
          where: {
            id: eachRentingDetail.renting_detail_id,
          },
        });
       let paidRentingDetail =  await RentingDetail.update(
          {
            is_renting_pay: paidType.PAID,
            renting_pay_amount: roomPrice,
            proof_of_payment: payment_no,
          },
          {
            where: {
              id: eachRentingDetail.renting_detail_id,
            },
            transaction: t,
          }
        );

        await PaymentDetail.create({
          name:
            payment_detail_enum.RENTING.LA +
              " ເດືອນ " +
              (date.parse(updatingRentingDetail, "MM") - 1) ==
            "0"
              ? "12"
              : date.parse(updatingRentingDetail, "MM") - 1,
          price: roomPrice,
          type: payment_detail_enum.RENTING.EN,
          payment_id: payment,
        });


        let paidRentingDetailData = await RentingDetail.findOne({
          where:{
            id:paidRentingDetail
          }
        });

        if(date.isSameDay(paidRentingDetailData.end_date,renting_end_date) && months == 0){
         let newRentingId =  await RentingDetail.create({
            renting_id:renting_id,
            end_date: date.addMonths(
              date.parse(renting_end_date, "YYYY-MM-DD"),
              1
            ),
            is_renting_pay:paidType.UNPAID,
          });

          await Trash.create({
            renting_detail_id:newRentingId,
            is_trash_pay:paidType.UNPAID,
          
          });
        }
        
      }
      if (eachRentingDetail.trash_pay) {
        await Trash.update(
          {
            is_trash_pay: paidType.PAID,
            trash_pay_amount: allTrashPrice,
            proof_of_payment: payment_no,
          },
          {
            where: {
              renting_detail_id: eachRentingDetail.renting_detail_id,
            },
            transaction: t,
          }
        );
        await PaymentDetail.create({
          name:
            payment_detail_enum.TRASH.LA +
              " ເດືອນ " +
              (date.parse(updatingRentingDetail, "MM") - 1) ==
            "0"
              ? "12"
              : date.parse(updatingRentingDetail, "MM") - 1,
          price: roomPrice,
          type: payment_detail_enum.TRASH.EN,
          payment_id: payment,
        });

      
      }
    }


    if(months>0){
      let future_end_renting_date = date.addMonths(
        date.parse(renting_end_date, "YYYY-MM-DD"),
        (months+1)
      );
      for (let i = 0; i <= months; i++) {
        if (i == months) {
         let emptyRenting =  await RentingDetail.create(
            {
              renting_id: renting_id,
              end_date: date.addMonths(
                date.parse(renting_end_date, "YYYY-MM-DD"),
                i
              ),
              is_trash_pay: paidType.UNPAID,
              is_renting_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );

          await Trash.create({
            renting_detail_id:emptyRenting,
            is_trash_pay:paidType.UNPAID,
          },{
            transaction: t,
          });
        } else {
          let aEndDate = date.addMonths(
            date.parse(renting_end_date, "YYYY-MM-DD"),
            i
          );
          let newPaidRentingDetail =  await RentingDetail.create(
            {
              renting_id: renting.id,
              end_date:aEndDate,
              is_trash_pay: paidType.UNPAID,
              is_renting_pay: paidType.PAID,
              renting_pay_amount: roomPrice,
              renting_pay_by: validateResult.renting_pay_by,
            },
            {
              transaction: t,
            }
          );
          if(validateResult.trash_months>=i)
          {
            await Trash.create({
              renting_detail_id:newPaidRentingDetail,
              is_trash_pay:paidType.PAID,
              trash_pay_amount:allTrashPrice,
              proof_of_payment:payment_no
            },{
              transaction: t,
            });
            await PaymentDetail.create({
              name: payment_detail_enum.TRASH.LA +
              " ເດືອນ " +
              (date.parse(aEndDate, "MM") - 1) ==
            "0"
              ? "12"
              : date.parse(aEndDate, "MM") - 1,
              price:allTrashPrice,
              type:payment_detail.TRASH.EN,
              payment_id:payment
            },{
              transaction: t
            });
          }else{
            await Trash.create({
              renting_detail_id:newPaidRentingDetail,
              is_trash_pay:paidType.UNPAID,
            },{
              transaction: t
            });
          }
        }

        await Renting.update(
          {
            end_renting_date: future_end_renting_date,
          },
          {
            where: {
              id: renting_id,
            },
            transaction: t,
          }
        );
      }
    }
  
    await Payment.update({
      payment_no:payment_no,
    },{
      where:{
        payment:payment
      },
      transaction: t
    });


  



    // if (renting_detail.Renting.is_active) {
    //   if (
    //     months == 1 &&
    //     date.isSameDay(
    //       date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    //       date.parse(renting.end_renting_date, "YYYY-MM-DD")
    //     )
    //   ) {
    //     await RentingDetail.create(
    //       {
    //         renting_id: renting.id,
    //         end_date: end_renting_date,
    //         is_trash_pay: paidType.UNPAID,
    //         is_renting_pay: paidType.UNPAID,
    //       },
    //       {
    //         transaction: t,
    //       }
    //     );

    //     await Renting.update(
    //       {
    //         end_renting_date: end_renting_date,
    //       },
    //       {
    //         where: {
    //           id: renting.id,
    //         },
    //         transaction: t,
    //       }
    //     );
    //   } else if (
    //     months > 1 &&
    //     date.isSameDay(
    //       date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    //       date.parse(renting.end_renting_date, "YYYY-MM-DD")
    //     )
    //   ) {
    //     // for (let i = 1; i <= months; i++) {
    //     //   if (i == months) {
    //     //     await RentingDetail.create(
    //     //       {
    //     //         renting_id: renting.id,
    //     //         end_date: date.addMonths(
    //     //           date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    //     //           i
    //     //         ),
    //     //         is_trash_pay: paidType.UNPAID,
    //     //         is_renting_pay: paidType.UNPAID,
    //     //       },
    //     //       {
    //     //         transaction: t,
    //     //       }
    //     //     );
    //     //   } else {
    //     //     await RentingDetail.create(
    //     //       {
    //     //         renting_id: renting.id,
    //     //         end_date: date.addMonths(
    //     //           date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    //     //           i
    //     //         ),
    //     //         is_trash_pay: paidType.UNPAID,
    //     //         is_renting_pay: paidType.PAID,
    //     //         renting_pay_amount: roomPrice,
    //     //         renting_pay_by: validateResult.renting_pay_by,
    //     //       },
    //     //       {
    //     //         transaction: t,
    //     //       }
    //     //     );
    //     //   }
    //     // }
    //     // await Renting.update(
    //     //   {
    //     //     end_renting_date: end_renting_date,
    //     //   },
    //     //   {
    //     //     where: {
    //     //       id: renting.id,
    //     //     },
    //     //     transaction: t,
    //     //   }
    //     // );
    //   }
    // }
    

    // // await RentingDetail.update(
    // //   {
    // //     is_trash_pay: validateResult.trash_pay_option
    // //       ? paidType.PAID
    // //       : paidType.UNPAID,
    // //     is_renting_pay: paidType.PAID,
    // //     renting_pay_amount: roomPrice,
    // //     trash_pay_amount: allTrashPrice,
    // //     fine: fine,
    // //     renting_pay_by: validateResult.renting_pay_by,
    // //     trash_pay_by: validateResult.trash_pay_option
    // //       ? validateResult.renting_pay_by
    // //       : null,
    // //   },
    // //   {
    // //     where: {
    // //       id: renting_detail.id,
    // //     },
    // //     transaction: t,
    // //   }
    // // );

    // // let months = validateResult.months;

    // // let end_renting_date = date.addMonths(
    // //   date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    // //   months
    // // );

    // // if (renting_detail.Renting.is_active) {
    // //   if (
    // //     months == 1 &&
    // //     date.isSameDay(
    // //       date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    // //       date.parse(renting.end_renting_date, "YYYY-MM-DD")
    // //     )
    // //   ) {
    // //     await RentingDetail.create(
    // //       {
    // //         renting_id: renting.id,
    // //         end_date: end_renting_date,
    // //         is_trash_pay: paidType.UNPAID,
    // //         is_renting_pay: paidType.UNPAID,
    // //       },
    // //       {
    // //         transaction: t,
    // //       }
    // //     );

    // //     await Renting.update(
    // //       {
    // //         end_renting_date: end_renting_date,
    // //       },
    // //       {
    // //         where: {
    // //           id: renting.id,
    // //         },
    // //         transaction: t,
    // //       }
    // //     );
    // //   } else if (
    // //     months > 1 &&
    // //     date.isSameDay(
    // //       date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    // //       date.parse(renting.end_renting_date, "YYYY-MM-DD")
    // //     )
    // //   ) {
    // //     for (let i = 1; i <= months; i++) {
    // //       if (i == months) {
    // //         await RentingDetail.create(
    // //           {
    // //             renting_id: renting.id,
    // //             end_date: date.addMonths(
    // //               date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    // //               i
    // //             ),
    // //             is_trash_pay: paidType.UNPAID,
    // //             is_renting_pay: paidType.UNPAID,
    // //           },
    // //           {
    // //             transaction: t,
    // //           }
    // //         );
    // //       } else {
    // //         await RentingDetail.create(
    // //           {
    // //             renting_id: renting.id,
    // //             end_date: date.addMonths(
    // //               date.parse(renting_detail.end_date, "YYYY-MM-DD"),
    // //               i
    // //             ),
    // //             is_trash_pay: paidType.UNPAID,
    // //             is_renting_pay: paidType.PAID,
    // //             renting_pay_amount: roomPrice,
    // //             renting_pay_by: validateResult.renting_pay_by,
    // //           },
    // //           {
    // //             transaction: t,
    // //           }
    // //         );
    // //       }
    // //     }
    // //     await Renting.update(
    // //       {
    // //         end_renting_date: end_renting_date,
    // //       },
    // //       {
    // //         where: {
    // //           id: renting.id,
    // //         },
    // //         transaction: t,
    // //       }
    // //     );
    // //   }
    // // }

    // // if (date.isSameDay(date.parse(renting_detail.end_date,"YYYY-MM-DD"), date.parse(renting.end_renting_date,"YYYY-MM-DD"))) {

    // //   if(months==1){
    // //     months++;
    // //   }
    // //   for (let i = 1; i <= months; i++) {

    // //     await RentingDetail.create(
    // //       {
    // //         renting_id: renting.id,
    // //         end_date: date.addMonths(now, i),
    // //         is_trash_pay: false,
    // //         is_renting_pay: false,
    // //       },
    // //       {
    // //         transaction: t,
    // //       }
    // //     );
    // //   }
    // //   await Renting.update(
    // //     {
    // //       end_renting_date: end_renting_date,
    // //     },
    // //     {
    // //       where: {
    // //         id: renting.id,
    // //       },
    // //       transaction: t,
    // //     }
    // //   );
    // // }

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
//         if(date.isSameDay(rentrentinging_detail.end_date,.end_renting_date)){
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
    if (!renting) throw createHttpError.NotFound("Renting not found");

    const checkNotPayRecord = await RentingDetail.findOne({
      where: {
        end_date: renting.end_renting_date,
      },
    });

    if (renting.is_active == false) {
      throw createHttpError.BadRequest("This renting is already checked out");
    }

    if (validationResult.bypass_checkout) {
      if (
        checkNotPayRecord.is_trash_pay != paidType.PAID ||
        checkNotPayRecord.is_renting_pay != paidType.PAID
      ) {
        throw createHttpError(
          400,
          "Due bypass check option you need to make a payment before checkout"
        );
      }
    } else {
      if (checkNotPayRecord.is_trash_pay != paidType.PAID) {
        checkNotPayRecord.is_trash_pay = paidType.PASS;
      }

      if (checkNotPayRecord.is_renting_pay != paidType.PAID) {
        checkNotPayRecord.is_renting_pay = paidType.PASS;
      }
      checkNotPayRecord.save();
    }

    // if (validationResult.bypass_checkout) {
    //   const checkNotPayRecord = await RentingDetail.findAll({
    //     where: {
    //       [Op.or]: [
    //         {
    //           is_trash_pay: false,
    //         },
    //         { is_renting_pay: false },
    //       ],
    //     },
    //   });
    //   if (
    //     typeof checkNotPayRecord !== "undefined" &&
    //     checkNotPayRecord.length > 0
    //   ) {
    //     throw createHttpError(
    //       400,
    //       "Due bypass check option you need to make a payment before checkout"
    //     );
    //   }
    // }
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

    await Room.update(
      {
        is_active: false,
      },
      {
        where: {
          id: renting.room_id,
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
      include: [Room, RentingDetail],
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
  try {
    const renting_detail_id = req.params.id;

    const rentingDetailData = await RentingDetail.findOne({
      where: {
        id: renting_detail_id,
      },
      include: ["trash_pay", "renting_pay"],
    });
    return res.status(200).json({
      data: rentingDetailData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllRentingDetail = async (req, res, next) => {
  try {
    let option = [];
    if (req.query.isTrashPay === "true") {
      option.push({ is_trash_pay: paidType.PAID });
      //option.is_trash_pay =true;
    }
    if (req.query.isTrashPay === "false") {
      // option.is_trash_pay =false;
      option.push({ is_trash_pay: paidType.UNPAID });
    }
    if (req.query.isRentingPay === "true") {
      // option.is_renting_pay =true;
      option.push({ is_renting_pay: paidType.PAID });
    }
    if (req.query.isRentingPay === "false") {
      option.push({ is_renting_pay: paidType.UNPAID });
      //  option.is_renting_pay =false;
    }

    let rentingDetailData = await RentingDetail.findAll({
      where: {
        [Op.and]: option,
      },
      include: ["trash_pay", "renting_pay"],
    });
    return res.status(200).json({
      data: rentingDetailData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.addContract = async (req, res, next) => {
  try {
  } catch (err) {}
};
