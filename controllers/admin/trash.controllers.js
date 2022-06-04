import {
  sequelize,
  RentingDetail,
  Renting,
  Room,
  Type,
  UserRenting,
  User,
  Setting,
  Trash,
  Payment
} from "../../models";
import payment_detail_enum from "../../constants/payment_detail";
import { Op } from "sequelize";
import price from "../../constants/price";
import createHttpError from "http-errors";
import { payTrashSchema } from "../../validators/admins/trash.validator";

import paidType from "../../constants/paidType";

import { getTrashPrice } from "../../constants/price";
// count people in renting and calculate price
exports.payTrash = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validationResult = await payTrashSchema.validateAsync(req.body);

   

    const isUserExist = await User.findByPk(validationResult.pay_by);

    if (!isUserExist) throw createHttpError(404, "User is not found");

    // const amountOfPeople = await UserRenting.count({
    //   where: {
    //     renting_id: renting_detail.renting_id,
    //   },
    // });
    

    // if (amountOfPeople <= 0) {
    //   return res
    //     .status(404)
    //     .json({
    //       message: "Renting result not found or no user in renting list",
    //     });
    // }

    const trash_price = await Setting.findOne({
      where:{
        name:"trash_price"
      }
  });


  let payment = await Payment.create({
    pay_by: validationResult.pay_by,
    renting_id: validationResult.renting_id,
    operate_by: req.user.user_id,
    pay_date: new Date(),
  });
  let payment_no = payment.toString().padStart(10, "0");
    //let allTrashPrice = getTrashPrice() * amountOfPeople;

   // let allTrashPrice = parseInt(trash_price) * amountOfPeople;
   for(let eachTrashPay of validationResult.trash_pay_id){
    const trash_detail = await Trash.findOne(
    {
      where:{
        id:eachTrashPay
      },
      include:RentingDetail
    }
      
    );

    if (!trash_detail) createHttpError.NotFound("Trash not found");

    if (trash_detail.is_trash_pay==paidType.PAID) {
      throw createHttpError(400, "This record already paid");
    }

    if(trash_detail.RentingDetail.renting_id!=validationResult.renting_id){
      throw createHttpError(400,"Some record not match Renting Detail");
    }
 


    
    await Trash.update(
      {
        is_trash_pay: paidType.PAID,
        trash_pay_amount: trash_price,
        trash_pay_by:validationResult.pay_by,
        proof_of_payment:payment_no
      },
      {
        where: {
          id: eachTrashPay
        },
      },
      {
        transaction: t,
      }

    );

    await PaymentDetail.create({
      name: payment_detail_enum.TRASH.LA +
      " ເດືອນ " +
      (date.parse(trash_detail.RentingDetail.end_date, "MM") - 1) ==
    "0"
      ? "12"
      : date.parse(trash_detail.RentingDetail.end_date, "MM") - 1,
      price:trash_price,
      type:payment_detail_enum.TRASH.EN,
      payment_id:payment
    },{
      transaction: t
    });
 
  }
  

  await Payment.update({
    payment_no:payment_no
  },{
    where:{
      id:payment
    }
  })
  
    await t.commit();
    return res.status(200).json({
      message: "Trash pay successfully",
      success: true,
    });

    /**
         * 
         where: {
        [Op.and]: [
          { questionId: req.params.id },
          { nextQuestion: validationResult.nextQuestion_id },
        ],
      },
         */
  } catch (err) {
    await t.rollback();
    next(err);
  }
};



