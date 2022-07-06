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
import { format } from "date-fns";
import rentingdetail from "../../models/rentingdetail";

require('dotenv').config();
const { dirname } = require('path');
import { promises } from "fs";

exports.checkIn = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
 
    const validateResult = await checkInSchema.validateAsync(req.body);
    const now = validateResult.start_renting;
    let nextDate = now;
    let totalPrice = 0;
    let end_renting_date =date.addDays(now, validateResult.renting_month * 30);
    let newPaymentData = null;
    let newPaymentDataNo = null;
    if(validateResult.renting_pay==false){
      end_renting_date =date.addDays(now, 1 * 30);
    }
    else if (validateResult.renting_months > 0) {
      end_renting_date = date.addDays(
        now,
        validateResult.renting_months * 30 + 2 * 30
      );
    } else {
      end_renting_date = date.addDays(now, 30 * 2);
    }
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

    let trash_settings = await Setting.findOne({
      where: {
        name: "trash_price",
      },
    });

    let trash_price = trash_settings.value;

    const renting = await Renting.create(
      {
        room_id: validateResult.room_id,
        start_renting_date: now,
        end_renting_date: end_renting_date,
        is_active: 1,
        deposit: validateResult.deposit,
        staff_id: req.user.id,
        user_id: validateResult.renting_pay_by,
      },
      {
        transaction: t,
      }
    );

   

    const roomPrice = room.Type.price;

    // let rentingDetailOption = {
    //   renting_id: renting.id,
    //   is_trash_pay:
    //     validateResult.trash_pay == true ? paidType.PAID : paidType.UNPAID,
    //   is_renting_pay:
    //     validateResult.renting_pay == true ? paidType.PAID : paidType.UNPAID,
    //   // trash_pay_amount: 0,
    // };
let user;
    if (validateResult.renting_pay) {
    //  rentingDetailOption.renting_pay_amount = room.Type.price;
      if (validateResult.renting_pay_by) {
         user = await User.findByPk(validateResult.renting_pay_by);
        if (!user) {
          throw createHttpError(404, "user not found");
        }
     //   rentingDetailOption.renting_pay_by = validateResult.renting_pay_by;
      } else {
        throw createHttpError(422, "Please provide a user id");
      }

      nextDate = date.addDays(nextDate, 30 * 1);

      if(newPaymentData==null){
        newPaymentData = await Payment.create(
         {
           pay_by: validateResult.renting_pay_by,
           total: totalPrice,
           renting_id: renting.id,
           operate_by: req.user.id,
           pay_date: date.format(new Date(), "YYYY-MM-DD HH:mm:ss"),
           // pay_by: validateResult.renting_pay_by,
           // renting_id: renting.id,
           // operate_by: req.user.id,
         },
         {
           transaction: t,
         }
       );
        newPaymentDataNo = newPaymentData.id.toString().padStart(10, "0");
      }

      let rentingID = await RentingDetail.create(
        {
          start_date: date.format(date.addDays(nextDate, -30), "YYYY-MM-DD"),
          end_date: nextDate,
          renting_id: renting.id,
          is_renting_pay: paidType.PAID,
          renting_pay_amount: roomPrice,
          proof_of_payment: newPaymentData.id,
          pay_by: validateResult.renting_pay_by,
          operate_by: req.user.id,
          fine: 0,
        },
        {
          transaction: t,
        }
      );
      await PaymentDetail.create(
        {
          name:
            payment_detail_enum.RENTING.LA +
            "ວັນທີ " +
            date.format(date.addDays(nextDate, -30), "YYYY-MM-DD").toString() +
            " - " +
            date.format(nextDate, "YYYY-MM-DD"),
          price: roomPrice,
          type: payment_detail_enum.RENTING.EN,
          payment_id: newPaymentData.id,
        },
        {
          transaction: t,
        }
      );
      totalPrice += parseInt(roomPrice);

      if (validateResult.trash_pay) {
        await Trash.create(
          {
            rentingdetail_id: rentingID.id,
            is_trash_pay: paidType.PAID,
            pay_by: validateResult.renting_pay_by,
            operate_by: req.user.id,
            trash_pay_amount: trash_price,
            proof_of_payment: newPaymentData.id,
            
          },
          {
            transaction: t,
          }
        );

        if(newPaymentData==null){
          newPaymentData = await Payment.create(
           {
             pay_by: validateResult.renting_pay_by,
             total: totalPrice,
             renting_id: renting.id,
             operate_by: req.user.id,
             pay_date: date.format(new Date(), "YYYY-MM-DD HH:mm:ss"),
             // pay_by: validateResult.renting_pay_by,
             // renting_id: renting.id,
             // operate_by: req.user.id,
           },
           {
             transaction: t,
           }
         );
          newPaymentDataNo = newPaymentData.id.toString().padStart(10, "0");
        }

        await PaymentDetail.create(
          {
            name:
              payment_detail_enum.TRASH.LA +
              "ວັນທີ " +
              date
                .format(date.addDays(nextDate, -30), "YYYY-MM-DD")
                .toString() +
              " - " +
              date.format(nextDate, "YYYY-MM-DD").toString(),
            price: trash_price,
            type: payment_detail_enum.TRASH.EN,
            payment_id: newPaymentData.id,
          },
          {
            transaction: t,
          }
        );

        totalPrice += parseInt(trash_price);
      } else {
        await Trash.create(
          {
            rentingdetail_id: rentingID.id,
            is_trash_pay: paidType.UNPAID,
            
            
          },
          {
            transaction: t,
          }
        );
      }
    }

    if (validateResult.renting_months <= 0) {
      nextDate = date.addDays(nextDate, 30 * 1);

      let rentingID = await RentingDetail.create(
        {
          start_date: date.format(date.addDays(nextDate, -30), "YYYY-MM-DD"),
          end_date: nextDate,
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
          rentingdetail_id: rentingID.id,
          is_trash_pay: paidType.UNPAID,
        
          
        },
        {
          transaction: t,
        }
      );
    } else {
      //  nextDate = date.addDays(nextDate, 30);

      for (let i = 0; i <= validateResult.renting_months; i++) {
        if (i == validateResult.renting_months) {
          let rentingID = await RentingDetail.create(
            {
              start_date: date.format(
                date.addDays(nextDate, i * 30),
                "YYYY-MM-DD"
              ),
              end_date: date.addDays(nextDate, i * 30 + 1 * 30),
              renting_id: renting.id,
              is_trash_pay: paidType.UNPAID,
              is_renting_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );

          await Trash.create(
            {
              rentingdetail_id: rentingID.id,
              is_trash_pay: paidType.UNPAID,
            
            },
            {
              transaction: t,
            }
          );
        } else {
          let rentingID = await RentingDetail.create(
            {
              start_date: date.format(
                date.addDays(nextDate, i * 30),
                "YYYY-MM-DD"
              ),
              end_date: date.addDays(nextDate, i * 30 + 1 * 30),
              renting_id: renting.id,
              is_trash_pay: paidType.PAID,
              is_renting_pay: paidType.PAID,
              renting_pay_amount: roomPrice,
              proof_of_payment: newPaymentDataNo,
              pay_by: validateResult.renting_pay_by,
              operate_by: req.user.id,
              fine: 0,
            },
            {
              transaction: t,
            }
          );
          if(newPaymentData==null){
            newPaymentData = await Payment.create(
             {
               pay_by: validateResult.renting_pay_by,
               total: totalPrice,
               renting_id: renting.id,
               operate_by: req.user.id,
               pay_date: date.format(new Date(), "YYYY-MM-DD HH:mm:ss"),
               // pay_by: validateResult.renting_pay_by,
               // renting_id: renting.id,
               // operate_by: req.user.id,
             },
             {
               transaction: t,
             }
           );
            newPaymentDataNo = newPaymentData.id.toString().padStart(10, "0");
          }

          await PaymentDetail.create(
            {
              name:
                payment_detail_enum.RENTING.LA +
                "ວັນທີ " +
                date
                  .format(date.addDays(nextDate, i * 30), "YYYY-MM-DD")
                  .toString() +
                " - " +
                date
                  .format(date.addDays(nextDate, (i + 1) * 30), "YYYY-MM-DD")
                  .toString(),
              price: roomPrice,
              type: payment_detail_enum.RENTING.EN,
              payment_id: newPaymentData.id,
            },
            {
              transaction: t,
            }
          );
          totalPrice += parseInt(roomPrice);

          if (
            validateResult.trash_months > i &&
            validateResult.trash_months != 0
          ) {
            await Trash.create(
              {
                rentingdetail_id: rentingID.id,
                is_trash_pay: paidType.PAID,
                trash_pay_amount: trash_price,
                proof_of_payment: newPaymentData.id,
                pay_by: validateResult.renting_pay_by,
                operate_by: req.user.id,
              
              },
              {
                transaction: t,
              }
            );

            await PaymentDetail.create(
              {
                name:
                  payment_detail_enum.TRASH.LA +
                  "ວັນທີ " +
                  date
                    .format(date.addDays(nextDate, i * 30), "YYYY-MM-DD")
                    .toString() +
                  " - " +
                  date
                    .format(date.addDays(nextDate, (i + 1) * 30), "YYYY-MM-DD")
                    .toString(),
                price: trash_price,
                type: payment_detail_enum.TRASH.EN,
                payment_id: newPaymentData.id,
              },
              {
                transaction: t,
              }
            );
            totalPrice += parseInt(trash_price);
          } else {
            await Trash.create(
              {
                renting_id: renting.id,
                is_trash_pay: paidType.UNPAID,
               
              },
              {
                transaction: t,
              }
            );
          }
        }
      }
      // else {
      //   let aEndDate = date.addMonths(now,i);
      //   let rentingID = await RentingDetail.create(
      //     {
      //       end_date: aEndDate,
      //       ...rentingDetailOption,
      //       proof_of_payment:payment_no
      //     },
      //     {
      //       transaction: t,
      //     }
      //   );

      //   if (
      //     validateResult.trash_months <= validateResult.renting_months &&
      //     validateResult.trash_months != 0
      //   ) {
      //     await Trash.create(
      //       {
      //         renting_detail_id: rentingID,
      //         is_trash_pay: paidType.PAID,
      //         trash_pay_amount: trash_price,
      //         proof_of_payment: payment_no,
      //       },
      //       {
      //         transaction: t,
      //       }
      //     );
      //     await PaymentDetail.create({
      //       name:
      //         payment_detail_enum.RENTING.LA +
      //           " ເດືອນ " +
      //           (date.parse(aEndDate, "MM") - 1) ==
      //         "0"
      //           ? "12"
      //           : date.parse(aEndDate, "MM") - 1,
      //       price: trash_price,
      //       type: payment_detail_enum.TRASH.EN,
      //       payment_id: payment.id,
      //     },
      //     {
      //       transaction:t
      //     });

      //   } else {
      //     await Trash.create(
      //       {
      //         renting_detail_id: rentingID,
      //         is_trash_pay: paidType.UNPAID,
      //         trash_pay_amount: trash_price,
      //         proof_of_payment: null,
      //       },
      //       {
      //         transaction: t,
      //       }
      //     );
      //   }
      // }
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

   if(newPaymentData!=null){
    await Payment.update(
      {
        payment_no: newPaymentDataNo,
        total: totalPrice,
      },
      {
        where: {
          id: newPaymentData.id,
        },
        transaction: t,
      }
    );
   }


    await t.commit();
    return res.status(200).json({
      success: true,
      data: renting,
      message: "Checking in successfully",
      contract_data:{
        staff_name:req.user.name,
        staff_personal_card_no:req.user.personal_card_no,
        user_name:user.name,
        user_personal_card:user.personal_card_no,
        people_count:validateResult.users_renting.length,
        contract_date:date.format(validateResult.start_renting,"YYYY-MM-DD"),
      }
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

    let months = validateResult.renting_months;
    let totalPrice = 0;

    const checkRenting = await Renting.findOne({
      where: {
        id: validateResult.renting_id,
      },
      include: [
        {
          model: Room,
          include: Type,
        },
      ],
    });

    if (!checkRenting) {
      throw createHttpError.NotFound("Renting not found");
    }
    let renting_end_date = checkRenting.end_renting_date;
    const roomPrice = checkRenting.Room.Type.price;
    let renting_id = checkRenting.id;

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

    let payment = await Payment.create(
      {
        pay_by: validateResult.renting_pay_by,
        renting_id: checkRenting.id,
        operate_by: req.user.id,
        pay_date: date.format(new Date(), "YYYY-MM-DD HH:mm:ss"),
      },
      {
        transaction: t,
      }
    );
    let payment_no = payment.id.toString().padStart(10, "0");

    const trash = await Setting.findOne({
      where: {
        name: "trash_price",
      },
    });
    const allTrashPrice = trash.value;

    if(validateResult.renting_pay){
    for (let eachRenitngDetail of validateResult.renting_pay) {
      const renting_detail = await RentingDetail.findOne({
        where: {
          id: eachRenitngDetail.renting_detail_id,
        },
        include: [Renting, Trash],
      });

      if (!renting_detail)
        throw createHttpError.NotFound("No renting detail found");

      if (renting_detail.renting_id != renting_id) {
        throw createHttpError.BadRequest(
          "Renting ID not match with renting detail ID"
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

      if (
        typeof eachRenitngDetail.trash_pay !== "undefined" &&
        eachRenitngDetail.trash_pay == true &&
        renting_detail.Trash.is_trash_pay == paidType.PAID
      ) {
        throw createHttpError(
          400,
          "Something went wrong some records of trash price has already paid"
        );
      }

      if (eachRenitngDetail.renting_pay) {
        await RentingDetail.update(
          {
            is_renting_pay: paidType.PAID,
            renting_pay_amount: roomPrice,
            proof_of_payment: payment_no,
            fine: typeof eachRenitngDetail.fine=="undefined"?0:eachRenitngDetail.fine,
            pay_by: validateResult.renting_pay_by,
            operate_by: req.user.id,
          },
          {
            where: {
              id: renting_detail.id,
            },
            transaction: t,
          }
        );

        await PaymentDetail.create(
          {
            name:
              payment_detail_enum.RENTING.LA +
              "ວັນທີ " +
              date
                .format(
                  date.addDays(
                    date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                    -30
                  ),
                  "YYYY-MM-DD"
                )
                .toString() +
              " - " +
              date.format(
                date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                "YYYY-MM-DD"
              ),
            price: roomPrice,
            type: payment_detail_enum.RENTING.EN,
            payment_id: payment.id,
          },
          {
            transaction: t,
          }
        );

        totalPrice += parseInt(roomPrice);
      }

      if (eachRenitngDetail.trash_pay) {
        await Trash.update(
          {
            is_trash_pay: paidType.PAID,
            trash_pay_amount: allTrashPrice,
            proof_of_payment: payment_no,
            pay_by:validateResult.renting_pay_by,
            operate_by:req.user.id
          },
          {
            where: {
              rentingdetail_id: eachRenitngDetail.renting_detail_id,
            },
            transaction: t,
          }
        );

        await PaymentDetail.create(
          {
            name:
              payment_detail_enum.TRASH.LA +
              "ວັນທີ " +
              date
                .format(
                  date.addDays(
                    date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                    -30
                  ),
                  "YYYY-MM-DD"
                )
                .toString() +
              " - " +
              date
                .format(
                  date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                  "YYYY-MM-DD"
                )
                .toString(),
            price: allTrashPrice,
            type: payment_detail_enum.TRASH.EN,
            payment_id: payment.id,
          },
          {
            transaction: t,
          }
        );
        totalPrice += parseInt(allTrashPrice);
      }
    

      if (typeof eachRenitngDetail.fine !=="undefined"&&parseInt(eachRenitngDetail.fine) != 0) {
        await PaymentDetail.create(
          {
            name:
              payment_detail_enum.FINE.LA +
              "ວັນທີ " +
              date
                .format(
                  date.addDays(
                    date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                    -30
                  ),
                  "YYYY-MM-DD"
                )
                .toString() +
              " - " +
              date
                .format(
                  date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                  "YYYY-MM-DD"
                )
                .toString(),
            price: eachRenitngDetail.fine,
            type: payment_detail_enum.FINE.EN,
            payment_id: payment.id,
          },
          {
            transaction: t,
          }
        );
        totalPrice += parseInt(eachRenitngDetail.fine);
      }

      if (
        date.isSameDay(
          date.parse(renting_detail.end_date, "YYYY-MM-DD"),
          date.parse(checkRenting.end_renting_date, "YYYY-MM-DD")
        ) &&
        months == 0
      ) {
        if (checkRenting.active == 0) {
          throw createHttpError(400, "this renting is already checkout");
        }

        let newRentingId = await RentingDetail.create(
          {
            renting_id: checkRenting.id,
            start_date: date.parse(renting_detail.end_date, "YYYY-MM-DD"),

            end_date: date.addDays(
              date.parse(renting_detail.end_date, "YYYY-MM-DD"),
              1 * 30
            ),
            is_renting_pay: paidType.UNPAID,
          },
          {
            transaction: t,
          }
        );

        await Renting.update(
          {
            end_renting_date: date.addDays(
              date.parse(renting_detail.end_date, "YYYY-MM-DD"),
              30 * 1
            ),
          },
          {
            where: {
              id: checkRenting.id,
            },
            transaction: t,
          }
        );

        await Trash.create(
          {
            rentingdetail_id: newRentingId.id,
            is_trash_pay: paidType.UNPAID,
          },
          {
            transaction: t,
          }
        );
      }
    }
  }

    if (months != 0) {
      if (checkRenting.active == 0) {
        throw createHttpError(400, "this renting is already checkout");
      }

      let future_end_renting_date = date.addDays(
        date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
        months * 30 + 1 * 30
      );

      for (let i = 0; i <= months; i++) {
        if (i == months) {
          let emptyRenting = await RentingDetail.create(
            {
              renting_id: checkRenting.id,
              start_date: date.addDays(
                date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
                i * 30
              ),
              end_date: date.addDays(
                date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
                i * 30 + 1 * 30
              ),
              is_trash_pay: paidType.UNPAID,
              is_renting_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );

          await Trash.create(
            {
              rentingdetail_id: emptyRenting.id,
              is_trash_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );
        } else {
          let aEndDate = date.addDays(
            date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
            i * 30 + 1 * 30
          );

          let newPaidRentingDetail = await RentingDetail.create(
            {
              start_date: date.addDays(aEndDate, -30),
              renting_id: checkRenting.id,
              end_date: aEndDate,
              is_renting_pay: paidType.PAID,
              renting_pay_amount: roomPrice,
              pay_by: validateResult.renting_pay_by,
              operate_by: req.user.id,
              proof_of_payment: payment_no,
              fine: 0,
            },
            {
              transaction: t,
            }
          );

          await PaymentDetail.create(
            {
              name:
                payment_detail_enum.RENTING.LA +
                "ວັນທີ " +
                date
                  .format(date.addDays(aEndDate, -30), "YYYY-MM-DD")
                  .toString() +
                " - " +
                date.format(aEndDate, "YYYY-MM-DD").toString(),
              price: roomPrice,
              type: payment_detail.RENTING.EN,
              payment_id: payment.id,
            },
            {
              transaction: t,
            }
          );

          totalPrice += parseInt(roomPrice);

          if (
            validateResult.trash_months >= i &&
            validateResult.trash_months != 0
          ) {
            await Trash.create(
              {
                rentingdetail_id: newPaidRentingDetail.id,
                is_trash_pay: paidType.PAID,
                trash_pay_amount: allTrashPrice,
                proof_of_payment: payment.id,
                pay_by: validateResult.renting_pay_by,
                operate_by: req.user.id,
              },
              {
                transaction: t,
              }
            );

            await PaymentDetail.create(
              {
                name:
                  payment_detail_enum.TRASH.LA +
                  "ວັນທີ " +
                  date
                    .format(date.addDays(aEndDate, -30), "YYYY-MM-DD")
                    .toString() +
                  " - " +
                  date.format(aEndDate, "YYYY-MM-DD").toString(),
                price: allTrashPrice,
                type: payment_detail.TRASH.EN,
                payment_id: payment.id,
              },
              {
                transaction: t,
              }
            );
            totalPrice += parseInt(allTrashPrice);
          } else {
            await Trash.create(
              {
                rentingdetail_id: newPaidRentingDetail.id,
                is_trash_pay: paidType.UNPAID,
              },
              {
                transaction: t,
              }
            );
          }
        }
      }

      await Renting.update(
        {
          end_renting_date: future_end_renting_date,
        },
        {
          where: {
            id: checkRenting.id,
          },
          transaction: t,
        }
      );
    }

    await Payment.update(
      {
        payment_no: payment_no,
        total: totalPrice,
      },
      {
        where: {
          id: payment.id,
        },
        transaction: t,
      }
    );

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
    const nowDate = date.format(new Date(), "YYYY-MM-DD");
    const validationResult = await checkOutSchema.validateAsync(req.body);
    let isLastRentingGotDelete = false;
    let checkout_payment = null;
    let checkout_no = "";
    let total = 0;
    const renting = await Renting.findOne({
      where: {
        id: validationResult.renting_id,
      },
    });
    if (!renting) throw createHttpError.NotFound("Renting not found");
    const twoLastedRecord = await RentingDetail.findAll({
      where: {
        renting_id: renting.id,
      },
      limit: 2,
      order: [["end_date", "DESC"]],
      include: Trash,
    });
    if (renting.is_active == false) {
      throw createHttpError.BadRequest("This renting is already checked out");
    }
    const trash = await Setting.findOne({
      where: {
        name: "trash_price",
      },
    });
    //  const allTrashPrice = trash.value;

    let aToDeleteRentingDetail;
    if (
      date
        .subtract(
          date.parse(nowDate, "YYYY-MM-DD"),
          date.parse(twoLastedRecord[0].end_date, "YYYY-MM-DD")
        )
        .toDays() > 30 &&
      validationResult.bypass_checkout == true
    ) {
      throw createHttpError(400, "Please pay renting before checking out");
    }
   


   if(!twoLastedRecord[1]){
    if (validationResult.bypass_checkout == true) {
      let rentingDetailData = await RentingDetail.findAll({
        where: {
          renting_id: renting.id,
        },
        include: Trash,
      });
    
      if (
        typeof rentingDetailData !== "undefined" &&
        rentingDetailData.length > 0
      ) {
        for (let eachRenting of rentingDetailData) {
        
          if (eachRenting.is_renting_pay == paidType.UNPAID) {
            await RentingDetail.update(
              {
                is_renting_pay: paidType.PASS,
              },
              {
                where: {
                  id: eachRenting.id,
                },
                transaction: t,
              }
            );
          }
         
          if (eachRenting.Trash.is_trash_pay == paidType.UNPAID) {
            await Trash.update(
              {
                is_trash_pay: paidType.PASS,
              },
              {
                where: {
                  rentingdetail_id: eachRenting.id,
                },
                transaction: t,
              }
            );
          }
          
        }
      }
   

      await Bill.update({
        is_pay: paidType.PASS,
      },{
        where:{
          is_pay:paidType.UNPAID,
          renting_id:renting.id
        },
        transaction: t,
      });

      //updatenice
     
      
    


    } else {
      //ຈ່າຍໂຕລ້າສຸດ ພ້ອມ ອອກບິນ
      let unpaidAllRentingDetails = await RentingDetail.findAll(
          {
            where: {
              renting_id: renting.id,
            },
            include: Trash,
          },
          {
            transaction: t,
          }
        );
      

      let checkId = twoLastedRecord[0].id;
      
     
      for (let eachUnpaid of unpaidAllRentingDetails) {
        if (eachUnpaid.id != checkId) {
          if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
            // console.log(checkId);
            // console.log(eachUnpaid.id);
            throw createHttpError(400, "Some renting not paid");
          }
          if (eachUnpaid.Trash.is_trash_pay == paidType.UNPAID) {
            throw createHttpError(400, "Some Trash not paid");
          }
        } else {
          if (!validationResult.pay_last_renting) {
            throw createHttpError(400, "Please provide a payment detail");
          }
          let paidBy = await User.findOne(
            {
              where: {
                id: validationResult.renting_pay_by,
              },
            },
            {
              transaction: t,
            }
          );
          if (!paidBy) {
            throw createHttpError(404, "User not found");
          }

         

          if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
            
            if (checkout_payment == null) {
              checkout_payment = await Payment.create(
                {
                  pay_by: validationResult.renting_pay_by,
                  renting_id: renting.id,
                  operate_by: req.user.id,
                  pay_date:new Date(),
                },
                {
                  transaction: t,
                }
              );

              

              checkout_no = checkout_payment.id.toString().padStart(10, "0");
              await RentingDetail.update(
                {
                  is_renting_pay: paidType.PAID,
                  end_date: nowDate,
                  renting_pay_amount: validationResult.amount,
                  proof_of_payment: checkout_no,
                  pay_by: validationResult.renting_pay_by,
                  operate_by: req.user.id,
                },
                {
                  where: {
                    id: checkId,
                  },
                  transaction: t,
                }
              );

              total+= parseInt(validationResult.amount);

              await Renting.update(
                {
                  end_renting_date: nowDate,
                },
                {
                  where: {
                    id: renting.id,
                  },
                  transaction: t,
                }
              );

              await PaymentDetail.create(
                {
                  name:
                    "ຈ່າຍຄ່າພັກເຊົ່າ ແລະ " +
                    payment_detail_enum.CHECKOUT.LA +
                    "ວັນທີ " +
                    date
                      .format(
                        date.addDays(
                          date.parse(eachUnpaid.end_date, "YYYY-MM-DD"),
                          -30
                        ),
                        "YYYY-MM-DD"
                      )
                      .toString() +
                    " - " +
                    date
                      .format(date.parse(nowDate, "YYYY-MM-DD"), "YYYY-MM-DD")
                      .toString(),
                  price: validationResult.amount,
                  type: payment_detail_enum.CHECKOUT.EN,
                  payment_id: checkout_payment.id,
                },
                {
                  transaction: t,
                }
              );
            }
          }
          ////////////////////////////////////////////////////////////////

        
          if (eachUnpaid.Trash.is_trash_pay == paidType.UNPAID) {
            if (checkout_payment == null) {
              checkout_payment = await Payment.create(
                {
                  pay_by: validationResult.renting_pay_by,
                  renting_id: renting.id,
                  operate_by: req.user.id,
                  pay_date:new Date(),
                },
                {
                  transaction: t,
                }
              );

              checkout_no = checkout_payment.id.toString().padStart(10, "0");
            }
              
                await Trash.update(
                {
                  is_trash_pay: paidType.PAID,
                  trash_pay_amount: validationResult.trash_amount,
                  proof_of_payment: checkout_payment.id,
                  pay_by: validationResult.renting_pay_by,
                  operate_by: req.user.id,
                },
                {
                  where: {
                    rentingdetail_id: checkId,
                  },
                  transaction: t,
                }
              );
           

              total+= parseInt(validationResult.trash_amount);

              await Renting.update(
                {
                  end_renting_date: nowDate,
                },
                {
                  where: {
                    id: renting.id,
                  },
                  transaction: t,
                }
              );

              await PaymentDetail.create(
                {
                  name:
                    "ຈ່າຍຄ່າຂີ້ເຫຍື້ອ ແລະ " +
                    payment_detail_enum.CHECKOUT.LA +
                    "ວັນທີ " +
                    date
                      .format(
                        date.addDays(
                          date.parse(eachUnpaid.end_date, "YYYY-MM-DD"),
                          -30
                        ),
                        "YYYY-MM-DD"
                      )
                      .toString() +
                    " - " +
                    date
                      .format(date.parse(nowDate, "YYYY-MM-DD"), "YYYY-MM-DD")
                      .toString(),
                  price: validationResult.trash_amount,
                  type: payment_detail_enum.CHECKOUT.EN,
                  payment_id: checkout_payment.id,
                },
                {
                  transaction: t,
                }
              );
            
          }
     
      
          /////////////////////////////////////////////////////
        }
      }
    }
    /////////////////////////////////////////
   }else{
    if (
      !(
        date
          .subtract(
            date.parse(nowDate, "YYYY-MM-DD"),
            date.parse(twoLastedRecord[1].end_date, "YYYY-MM-DD")
          )
          .toDays() > 0
      )
    ) {
      let aToDeleteTrash = await Trash.findOne({
        where: {
          id: twoLastedRecord[0].Trash.id,
        },
      });
      aToDeleteRentingDetail = await RentingDetail.findOne({
        where: {
          id: twoLastedRecord[0].id,
        },
        include: [Trash],
      });
      if (
        aToDeleteTrash.is_renting_pay != paidType.PAID
        //&& aToDeleteRentingDetail.Trash.is_trash_pay != paidType.PAID
      ) {
        await aToDeleteTrash.destroy({
          transaction: t,
        });
        await aToDeleteRentingDetail.destroy({
          transaction: t,
        });
        await Renting.update(
          {
            end_renting_date: twoLastedRecord[1].end_date,
          },
          {
            where: {
              id: renting.id,
            },
            transaction: t,
          }
        );
        isLastRentingGotDelete = true;
      }
    
    }
    if (validationResult.bypass_checkout == true) {
      let rentingDetailData = await RentingDetail.findAll({
        where: {
          renting_id: renting.id,
        },
        include: Trash,
      });
    
      if (
        typeof rentingDetailData !== "undefined" &&
        rentingDetailData.length > 0
      ) {
        for (let eachRenting of rentingDetailData) {
        
          if (eachRenting.is_renting_pay == paidType.UNPAID) {
            await RentingDetail.update(
              {
                is_renting_pay: paidType.PASS,
              },
              {
                where: {
                  id: eachRenting.id,
                },
                transaction: t,
              }
            );
          }
         
          if (eachRenting.Trash.is_trash_pay == paidType.UNPAID) {
            await Trash.update(
              {
                is_trash_pay: paidType.PASS,
              },
              {
                where: {
                  rentingdetail_id: eachRenting.id,
                },
                transaction: t,
              }
            );
          }
          
        }
      }
   

      await Bill.update({
        is_pay: paidType.PASS,
      },{
        where:{
          is_pay:paidType.UNPAID,
          renting_id:renting.id
        },
        transaction: t,
      });

      //updatenice
     
      
    


    } else {
      //ຈ່າຍໂຕລ້າສຸດ ພ້ອມ ອອກບິນ
      let unpaidAllRentingDetails;
      if (isLastRentingGotDelete) {
        unpaidAllRentingDetails = await RentingDetail.findAll(
          {
            where: {
              renting_id: renting.id,
              id: {
                [Op.ne]: aToDeleteRentingDetail.id,
              },
            },
            include: Trash,
          },
          
        );
      } else {
        unpaidAllRentingDetails = await RentingDetail.findAll(
          {
            where: {
              renting_id: renting.id,
            },
            include: Trash,
          },
          {
            transaction: t,
          }
        );
      }

      let checkId = null;

      if (isLastRentingGotDelete) {
       // console.log(true);
        checkId = twoLastedRecord[1].id;
      } else {
     //   console.log(false);
        checkId = twoLastedRecord[0].id;
   //     console.log(checkId);
      }

      for (let eachUnpaid of unpaidAllRentingDetails) {
        if (eachUnpaid.id != checkId) {
          if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
            // console.log(checkId);
            // console.log(eachUnpaid.id);
            throw createHttpError(400, "Some renting not paid");
          }
          if (eachUnpaid.Trash.is_trash_pay == paidType.UNPAID) {
            throw createHttpError(400, "Some Trash not paid");
          }
        } else {
          if (!validationResult.pay_last_renting) {
            throw createHttpError(400, "Please provide a payment detail");
          }
          let paidBy = await User.findOne(
            {
              where: {
                id: validationResult.renting_pay_by,
              },
            },
            {
              transaction: t,
            }
          );
          if (!paidBy) {
            throw createHttpError(404, "User not found");
          }

         

          if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
            
            if (checkout_payment == null) {
              checkout_payment = await Payment.create(
                {
                  pay_by: validationResult.renting_pay_by,
                  renting_id: renting.id,
                  operate_by: req.user.id,
                  pay_date:new Date(),
                },
                {
                  transaction: t,
                }
              );

              

              checkout_no = checkout_payment.id.toString().padStart(10, "0");
            }
              await RentingDetail.update(
                {
                  is_renting_pay: paidType.PAID,
                  end_date: nowDate,
                  renting_pay_amount: validationResult.amount,
                  proof_of_payment: checkout_no,
                  pay_by: validationResult.renting_pay_by,
                  operate_by: req.user.id,
                },
                {
                  where: {
                    id: checkId,
                  },
                  transaction: t,
                }
              );

              total+= parseInt(validationResult.amount);

              await Renting.update(
                {
                  end_renting_date: nowDate,
                },
                {
                  where: {
                    id: renting.id,
                  },
                  transaction: t,
                }
              );

              await PaymentDetail.create(
                {
                  name:
                    "ຈ່າຍຄ່າພັກເຊົ່າ ແລະ " +
                    payment_detail_enum.CHECKOUT.LA +
                    "ວັນທີ " +
                    date
                      .format(
                        date.addDays(
                          date.parse(eachUnpaid.end_date, "YYYY-MM-DD"),
                          -30
                        ),
                        "YYYY-MM-DD"
                      )
                      .toString() +
                    " - " +
                    date
                      .format(date.parse(nowDate, "YYYY-MM-DD"), "YYYY-MM-DD")
                      .toString(),
                  price: validationResult.amount,
                  type: payment_detail_enum.CHECKOUT.EN,
                  payment_id: checkout_payment.id,
                },
                {
                  transaction: t,
                }
              );
          //  }
          }
          ////////////////////////////////////////////////////////////////

          
          if (eachUnpaid.Trash.is_trash_pay == paidType.UNPAID) {
            if (checkout_payment == null) {
              checkout_payment = await Payment.create(
                {
                  pay_by: validationResult.renting_pay_by,
                  renting_id: renting.id,
                  operate_by: req.user.id,
                  pay_date:new Date(),
                },
                {
                  transaction: t,
                }
              );

              checkout_no = checkout_payment.id.toString().padStart(10, "0");
            }
              await Trash.update(
                {
                  is_trash_pay: paidType.PAID,
                  trash_pay_amount: validationResult.trash_amount,
                  proof_of_payment: checkout_payment.id,
                  pay_by: validationResult.renting_pay_by,
                  operate_by: req.user.id,
                },
                {
                  where: {
                    rentingdetail_id: checkId,
                  },
                  transaction: t,
                }
              );

              total+= parseInt(validationResult.trash_amount);

              await Renting.update(
                {
                  end_renting_date: nowDate,
                },
                {
                  where: {
                    id: renting.id,
                  },
                  transaction: t,
                }
              );

              await PaymentDetail.create(
                {
                  name:
                    "ຈ່າຍຄ່າຂີ້ເຫຍື້ອ ແລະ " +
                    payment_detail_enum.CHECKOUT.LA +
                    "ວັນທີ " +
                    date
                      .format(
                        date.addDays(
                          date.parse(eachUnpaid.end_date, "YYYY-MM-DD"),
                          -30
                        ),
                        "YYYY-MM-DD"
                      )
                      .toString() +
                    " - " +
                    date
                      .format(date.parse(nowDate, "YYYY-MM-DD"), "YYYY-MM-DD")
                      .toString(),
                  price: validationResult.trash_amount,
                  type: payment_detail_enum.CHECKOUT.EN,
                  payment_id: checkout_payment.id,
                },
                {
                  transaction: t,
                }
              );
            
          }

          /////////////////////////////////////////////////////
        }
      }
    }
  }

    if (checkout_payment != null) {
      checkout_payment.payment_no = checkout_no;
      checkout_payment.total =total;
      await checkout_payment.save({ transaction: t });
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
    let option = {};
    if (typeof req.query.is_active !== "undefined") {
      if (req.query.is_active == "true") {
        option.is_active = true;
      } else if ((req.query.is_active = "false")) {
        option.is_active = false;
      }
    }

    
   


    let allRentingData = await Renting.findAll({
      where: option,
      include: [Bill, { model: Room, include: Type }],
    });
    allRentingData = JSON.stringify(allRentingData);
    allRentingData = JSON.parse(allRentingData);
    for(let i = 0 ;i<allRentingData.length;i++) {
      const appDir = dirname(require.main.filename);
           let dir = `${appDir}/public/images/resources/room/${allRentingData[i].Room.images_path.toString()}`;
          
           let allImages = [];
          const files = await promises.readdir(dir);
           for(let file of files){
               allImages.push(`${process.env.APP_DOMAIN}/images/resources/room/${allRentingData[i].Room.images_path.toString()}/${file.toString()}`)
           }
          


           allRentingData[i].Room.allImage = allImages;
  }
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
  const t = await sequelize.transaction();
  try {
    let renting_id = req.params.id;
    const rentingData = await Renting.findOne({
      where: {
        id: renting_id,
      },
      // include: [
      //   {model:Room,include:Type}, {model:RentingDetail,include:Trash},{
      //     model: User,
      //     as: "users",
      //   },
        
      // ],
    });

    if(rentingData.is_active == 1){
   
      let nowDate = new Date();
      const twoLastedRecord = await RentingDetail.findAll({
        where: {
          renting_id: renting_id,
        },
        limit: 1,
        order: [["end_date", "DESC"]],
        include: Trash,
      });

      let endDate = date.parse(twoLastedRecord[0].end_date, "YYYY-MM-DD");
      while(date
        .subtract(
          nowDate,
          endDate
        )
        .toDays() >= 0 )
      {
       
        let newRentingDetailData = await RentingDetail.create({
          start_date: endDate,
          renting_id: renting_id,
          end_date: date.addDays(endDate, 30),
          is_renting_pay: paidType.UNPAID
       
        },{
          transaction:t
        });
        await Trash.create({
          rentingdetail_id: newRentingDetailData.id,
            is_trash_pay: paidType.UNPAID,
        },{
          transaction:t
        });
        endDate = date.addDays(endDate,30);
      }

      await Renting.update({
        end_renting_date:date.format(endDate,"YYYY-MM-DD"),
      },{
        where:{
          id:renting_id
        },
        transaction:t
      });
    }
    await t.commit();

    const newRentingData = await Renting.findOne({
      where: {
        id: renting_id,
      },
      include: [
        {model:Room,include:Type}, {model:RentingDetail,include:Trash},{
          model: User,
          as: "users",
        },
        
      ],
    });
    return res.status(200).json({
      data: newRentingData,
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
      include: [
        Trash,
        "renting_pay_by",
        "renting_operate_by",
        {
          model: Renting,
          include: {
            model: Room,
            include: Type,
          },
        },
      ],
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

    // if (req.query.isTrashPay === "true") {
    //   option.push({ is_trash_pay: paidType.PAID });
    //   //option.is_trash_pay =true;
    // }
    // if (req.query.isTrashPay === "false") {
    //   // option.is_trash_pay =false;
    //   option.push({ is_trash_pay: paidType.UNPAID });
    // }

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
      include: [
        "renting_pay_by",
        "renting_operate_by",
        {
          model: Renting,
          include: {
            model: Room,
            include: Type,
          },
        },
      ],
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
  const image = req.files[0];
  const renting_id = req.params.id;
  const t = await sequelize.transaction();
  try {
    if (!image) {
      throw createHttpError(400, "Image not found");
    }
    let checkRenting = await Renting.findByPk(renting_id);
    if (!checkRenting) {
      throw createHttpError(400, "Renting not found");
    }
    checkRenting.contract_path = image.filename;
    await checkRenting.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      data: checkRenting,
      message: "Add contract successfully",
      success: true,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.addProofOfPayment = async (req, res, next) => {
  try {
    const image = req.files[0];
    const payment_id = req.params.id;
    const t = await sequelize.transaction();
    try {
      if (!image) {
        throw createHttpError(400, "Image not found");
      }
      let checkPayment = await Payment.findByPk(payment_id);
      if (!checkPayment) {
        throw createHttpError(400, "Renting not found");
      }
      checkPayment.proof_of_payment = image.filename;
      await checkPayment.save({ transaction: t });

      await t.commit();

      return res.status(200).json({
        data: checkPayment,
        message: "Add contract successfully",
        success: true,
      });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  } catch (err) {
    next(err);
  }
};
