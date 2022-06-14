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

exports.checkIn = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validateResult = await checkInSchema.validateAsync(req.body);
    const now = validateResult.start_renting;
    let nextDate = now;
    let totalPrice = 0;

    let end_renting_date = date.addMonths(now, validateResult.months);
    if (validateResult.renting_months > 0) {
      end_renting_date = date.addMonths(now, validateResult.renting_months + 2);
    } else {
      end_renting_date = date.addMonths(now, 2);
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

    let payment = await Payment.create(
      {
        pay_by: validateResult.renting_pay_by,
        total: 10000,
        renting_id: renting.id,
        operate_by: req.user.id,
        pay_date: date.format(new Date(),"YYYY-MM-DD HH:mm:ss"),

        // pay_by: validateResult.renting_pay_by,
        // renting_id: renting.id,
        // operate_by: req.user.id,
      },
      {
        transaction: t,
      }
    );
    let payment_no = payment.id.toString().padStart(10, "0");

    const roomPrice = room.Type.price;

    let rentingDetailOption = {
      renting_id: renting.id,
      is_trash_pay:
        validateResult.trash_pay == true ? paidType.PAID : paidType.UNPAID,
      is_renting_pay:
        validateResult.renting_pay == true ? paidType.PAID : paidType.UNPAID,
      // trash_pay_amount: 0,
    };

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

      nextDate = date.addMonths(nextDate, 1);
      let rentingID = await RentingDetail.create(
        {
          end_date: nextDate,
          renting_id: renting.id,
          is_renting_pay: paidType.PAID,
          renting_pay_amount: roomPrice,
          proof_of_payment: payment_no,
          pay_by:validateResult.renting_pay_by,
          
          operate_by:req.user.id,
          fine:0
        },
        {
          transaction: t,
        }
      );

      await PaymentDetail.create(
        {
          name:
            date.format(nextDate, "M") - 1 == "0"
              ? payment_detail_enum.RENTING.LA + "ເດືອນ " + "12"
              : payment_detail_enum.RENTING.LA +
                "ເດືອນ " +
                (date.format(nextDate, "M") - 1).toString(),
          price: roomPrice,
          type: payment_detail_enum.RENTING.EN,
          payment_id: payment.id,
        },
        {
          transaction: t,
        }
      );
      totalPrice += parseInt(roomPrice);

      if (validateResult.trash_pay) {
        await Trash.create(
          {
            rentingdetails_id: rentingID.id,
            is_trash_pay: paidType.PAID,
            pay_by: validateResult.renting_pay_by,
            operate_by:req.user.id,
            trash_pay_amount: trash_price,
            proof_of_payment: payment.id,
          },
          {
            transaction: t,
          }
        );

        await PaymentDetail.create(
          {
            name:
              date.format(nextDate, "M") - 1 == "0"
                ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12"
                : payment_detail_enum.TRASH.LA +
                  "ເດືອນ " +
                  (date.format(nextDate, "M") - 1).toString(),
            price: trash_price,
            type: payment_detail_enum.TRASH.EN,
            payment_id: payment.id,
          },
          {
            transaction: t,
          }
        );

        totalPrice += parseInt(trash_price);
      } else {
        await Trash.create(
          {
            rentingdetails_id: rentingID.id,
            is_trash_pay: paidType.UNPAID,
            pay_by: validateResult.renting_pay_by,
          },
          {
            transaction: t,
          }
        );
      }
    }

    if (validateResult.renting_months <= 0) {
      nextDate = date.addMonths(nextDate, 1);
      let rentingID = await RentingDetail.create(
        {
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
          rentingdetails_id: rentingID.id,
          is_trash_pay: paidType.UNPAID,
        },
        {
          transaction: t,
        }
      );
    } else {
      //  nextDate = date.addMonths(nextDate, 1);
      for (let i = 0; i <= validateResult.renting_months; i++) {
        if (i == validateResult.renting_months) {
          let rentingID = await RentingDetail.create(
            {
              end_date: date.addMonths(nextDate, i + 1),
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
              rentingdetails_id: rentingID.id,
              is_trash_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );
        } else {
          let rentingID = await RentingDetail.create(
            {
              end_date: date.addMonths(nextDate, i + 1),
              renting_id: renting.id,
              is_trash_pay: paidType.PAID,
              is_renting_pay: paidType.PAID,
              renting_pay_amount: roomPrice,
              proof_of_payment: payment_no,
              pay_by:validateResult.renting_pay_by,
              operate_by:req.user.id,
              fine:0
            },
            {
              transaction: t,
            }
          );

          await PaymentDetail.create(
            {
              name:
                date.format(date.addMonths(nextDate, i + 1), "M") - 1 == "0"
                  ? payment_detail_enum.RENTING.LA + "ເດືອນ " + "12"
                  : payment_detail_enum.RENTING.LA +
                    "ເດືອນ " +
                    (
                      date.format(date.addMonths(nextDate, i + 1), "M") - 1
                    ).toString(),
              price: roomPrice,
              type: payment_detail_enum.RENTING.EN,
              payment_id: payment.id,
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
                rentingdetails_id: rentingID.id,
                is_trash_pay: paidType.PAID,
                trash_pay_amount: trash_price,
                proof_of_payment: payment.id,
                pay_by:validateResult.renting_pay_by,
                operate_by:req.user.id
              },
              {
                transaction: t,
              }
            );

            await PaymentDetail.create(
              {
                name:
                  date.format(date.addMonths(nextDate, i + 1), "M") - 1 == "0"
                    ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12"
                    : payment_detail_enum.TRASH.LA +
                      "ເດືອນ " +
                      (
                        date.format(date.addMonths(nextDate, i + 1), "M") - 1
                      ).toString(),
                price: trash_price,
                type: payment_detail_enum.TRASH.EN,
                payment_id: payment.id,
              },
              {
                transaction: t,
              }
            );
            totalPrice += parseInt(trash_price);
          } else {
            await Trash.create(
              {
                rentingdetails_id: rentingID.id,
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
        pay_date: date.format(new Date(),"YYYY-MM-DD HH:mm:ss"),
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
            fine:eachRenitngDetail.fine
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
              date.format(
                date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                "M"
              ) -
                1 ==
              "0"
                ? payment_detail_enum.RENTING.LA + "ເດືອນ " + "12"
                : payment_detail_enum.RENTING.LA +
                  "ເດືອນ " +
                  (
                    date.format(
                      date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                      "M"
                    ) - 1
                  ).toString(),
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
          },
          {
            where: {
              rentingdetails_id: eachRenitngDetail.renting_detail_id,
            },
            transaction: t,
          }
        );

        await PaymentDetail.create(
          {
            name:
              date.format(
                date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                "M"
              ) -
                1 ==
              "0"
                ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12"
                : payment_detail_enum.TRASH.LA +
                  "ເດືອນ " +
                  (
                    date.format(
                      date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                      "M"
                    ) - 1
                  ).toString(),
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

      if(parseInt(eachRenitngDetail.fine)!=0){
        await PaymentDetail.create(
          {
            name:
              date.format(
                date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                "M"
              ) -
                1 ==
              "0"
                ? payment_detail_enum.FINE.LA + "ເດືອນ " + "12"
                : payment_detail_enum.FINE.LA +
                  "ເດືອນ " +
                  (
                    date.format(
                      date.parse(renting_detail.end_date, "YYYY-MM-DD"),
                      "M"
                    ) - 1
                  ).toString(),
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
            end_date: date.addMonths(
              date.parse(renting_detail.end_date, "YYYY-MM-DD"),
              1
            ),
            is_renting_pay: paidType.UNPAID,
          },
          {
            transaction: t,
          }
        );

        await Renting.update(
          {
            end_renting_date: date.addMonths(
              date.parse(renting_detail.end_date, "YYYY-MM-DD"),
              1
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
            rentingdetails_id: newRentingId.id,
            is_trash_pay: paidType.UNPAID,
          },
          {
            transaction: t,
          }
        );
      }
    }

    if (months != 0) {
      if (checkRenting.active == 0) {
        throw createHttpError(400, "this renting is already checkout");
      }

      let future_end_renting_date = date.addMonths(
        date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
        months + 1
      );

      for (let i = 0; i <= months; i++) {
        if (i == months) {
          let emptyRenting = await RentingDetail.create(
            {
              renting_id: checkRenting.id,
              end_date: date.addMonths(
                date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
                i + 1
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
              rentingdetails_id: emptyRenting.id,
              is_trash_pay: paidType.UNPAID,
            },
            {
              transaction: t,
            }
          );
        } else {
          let aEndDate = date.addMonths(
            date.parse(checkRenting.end_renting_date, "YYYY-MM-DD"),
            i + 1
          );

          let newPaidRentingDetail = await RentingDetail.create(
            {
              renting_id: checkRenting.id,
              end_date: aEndDate,
              is_renting_pay: paidType.PAID,
              renting_pay_amount: roomPrice,
              pay_by: validateResult.renting_pay_by,
              operate_by:req.user.id,
              proof_of_payment: payment_no,
              fine:0
            },
            {
              transaction: t,
            }
          );

          await PaymentDetail.create(
            {
              name:
                date.format(aEndDate, "M") - 1 == "0"
                  ? payment_detail_enum.RENTING.LA + "ເດືອນ " + "12"
                  : payment_detail_enum.RENTING.LA +
                    "ເດືອນ " +
                    (date.format(aEndDate, "M") - 1).toString(),
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
                rentingdetails_id: newPaidRentingDetail.id,
                is_trash_pay: paidType.PAID,
                trash_pay_amount: allTrashPrice,
                proof_of_payment: payment.id,
                pay_by:validateResult.renting_pay_by,
                operate_by:req.user.id
              },
              {
                transaction: t,
              }
            );

            await PaymentDetail.create(
              {
                name:
                  date.format(aEndDate, "M") - 1 == "0"
                    ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12"
                    : payment_detail_enum.TRASH.LA +
                      "ເດືອນ " +
                      (date.format(aEndDate, "M") - 1).toString(),
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
                rentingdetails_id: newPaidRentingDetail.id,
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
    const allTrashPrice = trash.value;
   
  
    
    if (!(date.subtract(date.parse(nowDate,"YYYY-MM-DD"), date.parse(twoLastedRecord[1].end_date,"YYYY-MM-DD")).toDays() > 0)) {
    
    
      let aToDeleteTrash = await Trash.findOne({
        where: {
          id: twoLastedRecord[0].Trash.id,
        },
      });
    
      let aToDeleteRentingDetail = await RentingDetail.findOne({
        where: {
          id: twoLastedRecord[0].id,
        },
        include:[Trash]
      });
      
      if (
        aToDeleteTrash.is_renting_pay != paidType.PAID &&
        aToDeleteRentingDetail.Trash.is_trash_pay != paidType.PAID
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
  
 
  
    if (validationResult.validatebypass_checkout == true) {
      let rentingDetailData = await RentingDetail.findAll(
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
                  id: rentingDetailData.id,
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
                  rentingdetails_id: rentingDetailData.id,
                },
                transaction: t,
              }
            );
          }
        }
      } 
    }
    else{
  //ຈ່າຍໂຕລ້າສຸດ ພ້ອມ ອອກບິນ
  

  let unpaidAllRentingDetails = await RentingDetail.findAll(
    {
      where: {
        renting_id: renting.id,
      },
      include:Trash
    },
    {
      transaction: t,
    }
  );

  let checkId = null;
  
  

  if (isLastRentingGotDelete) {
    console.log(true);
    checkId = twoLastedRecord[1].id;
    
  } else {
    console.log(false);
    checkId = twoLastedRecord[0].id;
    console.log(checkId);
  }

  
 
  for (let eachUnpaid of unpaidAllRentingDetails) {
    if (eachUnpaid.id != checkId) {
      
      if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
        console.log(checkId);
        console.log(eachUnpaid.id);
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
     
      let checkout_payment = null;
      let checkout_no = "";

      
      if (eachUnpaid.is_renting_pay == paidType.UNPAID) {
        if (checkout_payment == null) {
          checkout_payment = await Payment.create(
            {
              pay_by: checkOutSchema.renting_pay_by,
              renting_id: renting.id,
              operate_by: req.user.id,
            },
            {
              transaction: t,
            }
          );

        
          checkout_no =  checkout_payment.id.toString().padStart(10, "0");
          await RentingDetail.update(
            {
              is_renting_pay: paidType.PAID,
              end_date: nowDate,
              renting_pay_amount: checkOutSchema.amount,
              proof_of_payment: checkout_no,
            },
            {
              where: {
                id:checkId,
              },
              transaction: t,
            }
          );

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
        

          await PaymentDetail.create({
            name: date.format(date.parse(eachUnpaid.end_date, "YYYY-MM-DD"), "M") - 1 == "0"
            ? payment_detail_enum.CHECKOUT.LA + "ເດືອນ " + "12"
            : payment_detail_enum.CHECKOUT.LA +
              "ເດືອນ " +
              (date.format(date.parse(eachUnpaid.end_date, "YYYY-MM-DD"), "M") - 1).toString(),
            price: validationResult.amount,
            type: payment_detail_enum.CHECKOUT.EN,
            payment_id: checkout_payment.id,
          },{
            transaction: t,
          });

      


        }
      }

      if (eachUnpaid.Trash.is_trash_pay == paidType.UNPAID) {
        if (checkout_payment == null) {
          checkout_payment = await Payment.create(
            {
              pay_by: validationResult.renting_pay_by,
              renting_id: renting.id,
              operate_by: req.user.id,
            },
            {
              transaction: t,
            }
          );
          checkout_no =  checkout_payment.id.toString().padStart(10, "0");
        }

        await PaymentDetail.create({
          name: date.format(date.parse(eachUnpaid.end_date,"YYYY=MM-DD"), "M") - 1 == "0"
          ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12"
          : payment_detail_enum.TRASH.LA +
            "ເດືອນ " +
            (date.format(date.parse(eachUnpaid.end_date,"YYYY-MM-DD"), "M") - 1).toString(),
          price: allTrashPrice,
          type: payment_detail_enum.TRASH.EN,
          payment_id: checkout_payment.id,
        },{
          transaction: t,
        });

      }

    }
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
      include: ["renting_pay_by", "renting_operate_by"],
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
    await checkRenting.save({transaction:t});

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
