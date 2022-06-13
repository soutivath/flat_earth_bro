import {
  sequelize,
  RentingDetail,
  Renting,
  Room,
  Type,
  UserRenting,
  PaymentDetail,
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
import date from "date-and-time";
import paidType from "../../constants/paidType";

import { getTrashPrice } from "../../constants/price";
// count people in renting and calculate price
exports.payTrash = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const validationResult = await payTrashSchema.validateAsync(req.body);

   let total= 0;

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
    operate_by: req.user.id,
    pay_date: new Date(),
  },{
    transaction:t
  });
  let payment_no = payment.id.toString().padStart(10, "0");
    //let allTrashPrice = getTrashPrice() * amountOfPeople;

   // let allTrashPrice = parseInt(trash_price) * amountOfPeople;
   for(let eachTrashPay of validationResult.trash_pay_id){
    const trash_detail = await Trash.findOne(
    {
      where:{
        id:eachTrashPay
      },
      include:"rentingdetails"
    }
      
    );

    if (!trash_detail) createHttpError.NotFound("Trash not found");

    if (trash_detail.is_trash_pay==paidType.PAID) {
      throw createHttpError(400, "This record already paid");
    }
  


    if(trash_detail.rentingdetails.renting_id!=validationResult.renting_id){
      throw createHttpError(400,"Some record not match Renting Detail");
    }
 


    
    await Trash.update(
      {
        is_trash_pay: paidType.PAID,
        trash_pay_amount: trash_price.value,
        pay_by:validationResult.pay_by,
        operate_by:req.user.id,
        proof_of_payment:payment_no
      },
      {
        where: {
          id: eachTrashPay
        },
        transaction: t,
      }
    );
    

    
    await PaymentDetail.create({
      name:  (date.format(date.parse(trash_detail.rentingdetails.end_date,"YYYY-MM-DD"), "M") - 1) ==
      "0"
      ? payment_detail_enum.TRASH.LA + "ເດືອນ " + "12": payment_detail_enum.TRASH.LA +
      "ເດືອນ " +
      (date.format(date.parse(trash_detail.rentingdetails.end_date, "YYYY-MM-DD"), "M") - 1).toString(),
      price:trash_price.value,
      type:payment_detail_enum.TRASH.EN,
      payment_id:payment.id
    },{
      transaction: t
    });
   total+=parseInt(trash_price.value);
 
  }
  

  await Payment.update({
    payment_no:payment_no,
    total:total
  },{
    where:{
      id:payment.id
    },
    transaction:t
  });
  
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



