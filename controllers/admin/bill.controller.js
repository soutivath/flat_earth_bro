import createHttpError from "http-errors";
import { sequelize, Renting, Bill, User, Room } from "../../models";
import {
  addBillSchema,
  billOperateSchema,
  updateBillSchema,
} from "../../validators/admins/bill.validator";
import fs from "fs";
import billType from "../../constants/billType";

import billImageTranformer from "../../tranformer/images/bill.tranformer";
import {bills} from "../../tranformer/bill.tranformer";


const path = require("path");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
exports.addBill = async (req, res, next) => {
  const image = req.files[0];

  const t = await sequelize.transaction();
  try {
    if (!image) {
      throw createHttpError(400, "Image not found");
    }
    const validatedResult = await addBillSchema.validateAsync(req.body);
    const checkRenting = await Renting.findByPk(validatedResult.renting_id);
    if (!checkRenting) {
      throw creaetHttpError(400, "Renting not found");
    }
    const newBill = await Bill.create({
      image_path: image.filename,
      price: validatedResult.price,
      bill_type: validatedResult.bill_type,
      is_pay: false,
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
      fs.unlinkSync(image.path);
    } catch (err) {
      console.log(err);
    }
    next(err);
  }
};

exports.payBill = async (req, res, next) => {
  try {
    const validatedResult = await billOperateSchema.validateAsync(req.body);

    const checkBill = await Bill.findByPk(req.params.id);

    if (!checkBill) {
      throw createHttpError(404, "Bill not found");
    }
    if (checkBill.is_pay) {
      throw createHttpError(400, "Bill is already paid");
    }
    const checkUser = await User.findOne({
      where: {
        id: validatedResult.pay_by,
      },
    });

    if (!checkUser) {
      throw createHttpError(404, "User not found");
    }
    const newBill = await Bill.update(
      {
        is_pay: true,
        pay_by: validatedResult.pay_by,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    return res.status(200).json({
      data: [],
      message: "Bill has been paid successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBill = async (req, res, next) => {
  try {
    const validatedResult = await updateBillSchema.validateAsync(req.body);
    const checkBill = await Bill.findByPk(req.params.id);

    if (!checkBill) {
      throw createHttpError(404, "Bill not found");
    }

    let changeObject = {};
    if (req.files) {
      changeObject["image_path"] = req.files[0].filename;
    }

    if (validatedResult.price) {
      changeObject["price"] = validatedResult.price;
    }
    if (validatedResult.bill_type) {
      changeObject["bill_type"] = validatedResult.bill_type;
    }

    const newBill = await Bill.update(changeObject, {
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

    return res.status(200).json({
      data: newBill,
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
    return res.status(200).json({ success: true, data: bill });
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
    const allRentingData = await Bill.findAll({
      where: option,
      include: [User, Renting],
    });
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
      plain: true,
      include: [Bill,Room],
    });
    allRentingData = JSON.stringify(allRentingData);
    allRentingData = JSON.parse(allRentingData);
    let billTranform = bills(allRentingData.Bills);
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
    let queryOption = {};
    queryOption.id = billID;
 
    let billData = await Bill.findOne({
      where: queryOption,
      include: User,
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
