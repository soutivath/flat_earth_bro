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
      include:"rentingdetail"
    }
      
    );
   
    if (!trash_detail) createHttpError.NotFound("Trash not found");

    if (trash_detail.is_trash_pay==paidType.PAID) {
      throw createHttpError(400, "This record already paid");
    }
  


    if(trash_detail.rentingdetail.renting_id!=validationResult.renting_id){
      throw createHttpError(400,"Some record not match Renting Detail");
    }
 


    
    await Trash.update(
      {
        is_trash_pay: paidType.PAID,
        trash_pay_amount: trash_price.value,
        pay_by:validationResult.pay_by,
        operate_by:req.user.id,
        proof_of_payment:payment.id
      },
      {
        where: {
          id: eachTrashPay
        },
        transaction: t,
      }
    );
    

    
    await PaymentDetail.create({
      name: payment_detail_enum.TRASH.LA +
      "ວັນທີ " +(date.format(date.addDays(date.parse(trash_detail.rentingdetail.end_date, "YYYY-MM-DD"),-30), "YYYY-MM-DD")).toString()+" - "+
      date.format(date.parse(trash_detail.rentingdetail.end_date, "YYYY-MM-DD"),"YYYY-MM-DD").toString(),
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

    let responsePayment = await Payment.findOne({
      where:{
        id:payment.id
      },
      include:[PaymentDetail,"payBy","operateBy"]
    });
    return res.status(200).json({
      message: "Trash pay successfully",
      success: true,
      payment_information:responsePayment
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

exports.getTrashDataFromRenting = async(req,res,next)=>{
  const t  = await sequelize.transaction();
  try{
    const query = {};
    const queryParam = req.query.isPaid;
    if(typeof queryParam!==undefined){
      if(queryParam=="true"){
        query.is_trash_pay = paidType.PAID
      }
      else if(queryParam =="false"){
        query.is_trash_pay = paidType.UNPAID;
      }
    }

  
    const renting_id = req.params.id;
    const rentingData = await Renting.findOne({
      where:{
        id:renting_id
      },
     // include:[Room,{model:RentingDetail,include:[{model:Trash,where:query}]}]
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
      where:{
        id:renting_id
      },
      include:[Room,{model:RentingDetail,include:[{model:Trash,where:query}]}]
    });

   
    return res.status(200).json({data:newRentingData,message:"Get data successfully",success:true});
  }catch(err){
    await t.rollback();
    next(err);
  }
}


exports.oneTrash = async(req,res,next)=>{
  try{
  
    const trash_id = req.params.id;
    const trash_data = await Trash.findOne({
      where:{
        id:trash_id
      },
     include:["rentingdetail","trash_pay_by","trash_operate_by"]
    });
    return res.status(200).json({data:trash_data,message:"Get data successfully",success:true});
  }catch(err){
    next(err);
  }
}



