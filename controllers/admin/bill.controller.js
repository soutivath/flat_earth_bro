import createHttpError from "http-errors";
import { sequelize, Renting, Bill, User, Room,Payment,Type,
  PaymentDetail } from "../../models";
import {
  addBillSchema,
  billOperateSchema,
  updateBillSchema,
  
} from "../../validators/admins/bill.validator";
import fs from "fs";
import billType from "../../constants/billType";
import payment_detail_enum from "../../constants/payment_detail";

import billImageTranformer from "../../tranformer/images/bill.tranformer";
import {bills} from "../../tranformer/bill.tranformer";
import date from "date-and-time";
import paidType from "../../constants/paidType";

const path = require("path");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
exports.addBill = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const image = req?.files[0];
    if(image===undefined){
      throw createHttpError(400,"Please provide an image");
    }
    if (!image) {
      throw createHttpError(400, "Image not found");
    }
    const validatedResult = await addBillSchema.validateAsync(req.body);
    const checkRenting = await Renting.findByPk(validatedResult.renting_id);
    if (!checkRenting) {
      throw createHttpError(400, "Renting not found");
    }
    const newBill = await Bill.create({
      image_path: image.filename,
      price: validatedResult.price,
      bill_type: validatedResult.bill_type,
      is_pay: paidType.UNPAID,
      renting_id: validatedResult.renting_id,
      is_user_read: false,
    });


    
    await t.commit();

    return res.status(200).json({
      data: newBill,
      message: "Bill created successfully",
      success: true,
    });
  } catch (err) {
    await t.rollback();
    try {
      console.log("deleting a bill image");
      fs.unlinkSync(image.path);
    } catch (err) {
      console.log(err);
    }
    next(err);
  }
};

exports.payBill = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    let totalPrice = 0;
    const validatedResult = await billOperateSchema.validateAsync(req.body);

    let checkUser = await User.findOne({
      where: {
        id: validatedResult.pay_by,
      },
    });
    if (!checkUser) {
      throw createHttpError(404, "User not found");
    }

    const now  = date.format(new Date(),"YYYY-MM-DD");
  
    let payment = await Payment.create({
      pay_by:validatedResult.pay_by,
      renting_id:validatedResult.renting_id,
      operate_by:req.user.id,
      pay_date:now
    },{
      transaction:t
    });

    let payment_no = payment.id.toString().padStart(10, "0");
   
    for(let aBill of validatedResult.bill_id){
      let checkBill = await Bill.findOne({
        where:{
          id:aBill
        },plain:true
      });
      if (!checkBill) {
        throw createHttpError(404, "Bill not found");
      }
      if (checkBill.is_pay==paidType.PAID) {
        throw createHttpError(400, "Some bills is already paid");
      }

      if(checkBill.renting_id != validatedResult.renting_id){
        throw createHttpError(400,"Renting ID not match");
      }
      await Bill.update(
        {
          is_pay: paidType.PAID,
          proof_of_payment:payment.id,
          pay_by:validatedResult.pay_by,
          operate_by: req.user.id
        },
        {
          where: {
            id: aBill,
          },
          transaction: t,
        }
      );
      
      totalPrice += parseInt(checkBill.price);
      let name = checkBill.bill_type=="water"?payment_detail_enum.WATER:payment_detail_enum.ELECTRIC;
    

 


   await PaymentDetail.create({
        name:name.LA +" ວັນທີ "+checkBill.createdAt,
        price:checkBill.price,
        type:name.EN,
        payment_id:payment.id,
      },{
        transaction: t,
      });
    }
   

    await Payment.update({
      total:totalPrice,
      payment_no:payment_no
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
      data: [],
      message: "Bill has been paid successfully",
      success: true,
      payment_information:responsePayment
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.updateBill = async (req, res, next) => {
  try {
    const validatedResult = await updateBillSchema.validateAsync(req.body);
    let checkBill = await Bill.findOne({where:{
      id:req.params.id
    },plain:true});

    if (!checkBill) {
      throw createHttpError(404, "Bill not found");
    }

    let changeObject = {};
    if (req.files[0]) {
    
      changeObject["image_path"] = req.files[0].filename;
     
    }

    if (validatedResult.price) {
      changeObject["price"] = validatedResult.price;
      checkBill.price = validatedResult.price;
    }
    if (validatedResult.bill_type) {
      changeObject["bill_type"] = validatedResult.bill_type;
      checkBill.bill_type = validatedResult.bill_type;
    }

    await Bill.update(changeObject, {
      where: {
        id: req.params.id,
      },
    });
    if (req.files) {
      try {
        fs.unlinkSync(
          `${appDir}/public/images/resources/bills/${checkBill.image_path}`
        );
      } catch (err) {}
    }

    if(req.files[0]){
      checkBill.image_path = req.files[0].filename;
    }
    

    return res.status(200).json({
      data: checkBill,
      message: "Bill updated successfully",
      success: true,
    });
  } catch (err) {
    try {
      fs.unlinkSync(req.files[0].path);
    } catch (err) {}

    
    next(err);
  }
};

exports.deleteBill = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    //  const validatedResult = await billOperateSchema.validateAsync(req.body);
    const checkBillExisting = await Bill.findByPk(req.params.id);
    if (!checkBillExisting) throw createHttpError(404, "Bill not found");
    const bill = await Bill.destroy({
      where: {
        id: req.params.id,
      },
    });
    try {
      fs.unlinkSync(
        `${appDir}/public/images/resources/bills/${checkBillExisting.image_path}`
      );
    } catch (err) {}
   
    await t.commit();
    return res.status(200).json({ success: true, data: null });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

//view data

exports.getAll = async (req, res, next) => {
  try {
    let option = {};
    if (typeof req.query.billType !== "undefined") {
      if (
        req.query.billType == billType.ELECTRIC ||
        req.query.billType == billType.WATER
      ) {
        option.bill_type = req.query.billType;
      }
    }

    if(typeof req.query.payBy !=="undefined") {
        option.pay_by = req.query.pay_by;

    }

    if(typeof req.query.isPaid!=="undefined") {
      if (
        req.query.is_pay == paidType.PAID ||
        req.query.is_pay == paidType.UNPAID
      ) {
        option.bill_type = req.query.billType;
      }
    }
    const allRentingData = await Bill.findAll({
      where: option,
      include: ["bill_pay_by","bill_operate_by", Renting],
    });

    return res.status(200).json({data:allRentingData});
    return res
      .status(200)
      .json({
        data: bills(allRentingData),
        message: "get data successfully",
        success: true,
      });
  } catch (err) {
    next(err);
  }
};

exports.getByRenting = async (req, res, next) => {
  try {
    let renting_id = req.params.id;
    let allRentingData = await Renting.findOne({
      where: {
        id: renting_id,
      },
      //plain: true,
      include: [{model:Bill,include:["bill_pay_by","bill_operate_by"]},{model:Room,include:Type}],
    });
    allRentingData = JSON.stringify(allRentingData);
    allRentingData = JSON.parse(allRentingData);
  
    let billTranform = bills(allRentingData.Bills);

    const user = await User.findOne({where: {id:allRentingData.user_id}});
    
   allRentingData.name = user.name;
   

    allRentingData.Bills = billTranform;

    
   
 

    return res.status(200).json({
      data:allRentingData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

/**
 *
 * @param {billType} req
 * @param {BillData} res
 * @param {error} next
 * @returns
 */
exports.getOne = async (req, res, next) => {
  try {
  
    let billID = req.params.id;
   
    // let queryOption = {};
    // queryOption.id = billID;
   
    let billData = await Bill.findOne({
    
      where: {
        id:billID,
      },
      include: ["bill_pay_by","bill_operate_by", {model:Renting,include:Room}],
    });
  
    if (billData!=null) {
      billData.image_path = billImageTranformer(billData.image_path);
    }
   

    return res.status(200).json({
      data: billData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};
