import { sequelize, User,Account } from "../../models";
import {
  postEditAdminSchema,
  addUserSchema,
  adminAddUserSchema,
} from "../../validators/admins/user.validator";
import fs from "fs";
import {Op} from "sequelize";
import createHttpError from "http-errors";
import {userTranformer} from "../../tranformer/user.tranformer";

import {randomTopicString} from "../../libs/utils/randomString";
exports.editUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const validatedResult = await postEditAdminSchema.validateAsync(req.body);
    let user = await User.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    if(user.is_admin=="superadmin"&&req.user.is_admin!="superadmin"){
      throw createHttpError(403,"You don't have permission to edit this user");
    }

    const checkUser = await User.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
        id:{
          [Op.ne]:req.user.id
        }
      },
    });
    if (checkUser) {
      throw createHttpError(400, "Phone number already exists");
    }

    const checkPersonalCardNo = await User.findOne({
      where: {
        phoneNumber: validatedResult.personal_card_no,
        id:{
          [Op.ne]:req.user.id
        }
      }});
      if (checkPersonalCardNo) {
        throw createHttpError(400, "personal card number is already exists");
      }


    let profilePath = user.getProfilePath();

    let option = {};

    option.name = validatedResult.name;
    option.phoneNumber = validatedResult.phoneNumber;
    option.is_admin = validatedResult.is_admin;
    option.personal_card_no = validatedResult.personal_card_no;

    if (req.files[0]) {
      option.image = req.files[0].filename;
    }

    await User.update(option, {
      where: {
        id: req.params.id,
      },
      transaction: t,
    });
    if (profilePath != "default_profile.png") {
      try {
        fs.unlinkSync(profilePath);
      } catch (err) {}
    }
    await t.commit();
    return res.status(200).json({
      data: [],
      message: "updated user successfully",
      success: true,
    });
  } catch (error) {
    try {
      fs.unlinkSync(req.files[0].path);
    } catch (err) {}
    await t.rollback();
    next(error);
  }
};

exports.addAdmin = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    
    let imageProfile = "default_profile.png";

    if (req.files[0]) {
      imageProfile = req.files[0].filename;
    }
    const validatedResult = await addUserSchema.validateAsync(req.body);
    const checkUser = await User.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
      },
    });
    if (checkUser) {
      throw createHttpError(400, "Phone number already exists");
    }

    if(req.user.is_admin!="superadmin"&&(validatedResult.is_admin=="superadmin"||validatedResult.is_admin== "admin")){
      throw createHttpError(403, "permission denied");
    }

    const checkPersonalCardNo = await User.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
      }});
      if (checkPersonalCardNo) {
        throw createHttpError(400, "personal card number is already exists");
      }

    const newAdmin = await User.create(
      {
        name: validatedResult.name,
        phoneNumber: validatedResult.phoneNumber,
        image: imageProfile,
        is_admin: validatedResult.is_admin,
        personal_card_no: validatedResult.personal_card_no
      },
      {
        transaction: t,
      }
    );

    await Account.create({
        phoneNumber:validatedResult.phoneNumber,
        notification_topic: randomTopicString(),
        user_id:newAdmin.id,
        display_name:validatedResult.name,
    },
    {
        transaction: t,
    });


    await t.commit();
    return res.status(200).json({
      data: newAdmin,
      message: "Create user successfully",
      success: true,
    });
  } catch (error) {
    try {
      fs.unlinkSync(req.files[0].path);
    } catch (err) {}
    await t.rollback();
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.params.id;
    if(req.user.user_id == userId){
    
      throw createHttpError(400,"You cannot delete ur account");
    }
    const user = await User.findByPk(userId);

    if(req.user.is_admin!="superadmin"&&(validatedResult.is_admin=="superadmin"||validatedResult.is_admin== "admin")){
    
      throw createHttpError(403, "permission denied");
    }


    const userImagePath = user.getProfilePath();

    await Account.destroy({
      where:{
        user_id:userId,
      }
    },{
      transaction: t,
    });

    await user.destroy({
      transaction: t,
    });
    try {
      fs.unlinkSync(userImagePath);
    } catch (err) {}
    await t.commit();
    return res.status(200).json({
      data: [],
      success: true,
      message: "Delete user successfully",
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    let option = {};
    if(req.query.isAdmin=="superadmin"){
      option.is_admin = "superadmin";
    }
    else if (req.query.isAdmin=="admin") {
      option.is_admin = "admin";
    } else if (req.query.isAdmin=="user" ) {
      option.is_admin = "user";
    }
    const userData = await User.findAll({
      where: option,
      include:Account
    });
   
    const tranformedData = userTranformer(userData);
    return res
      .status(200)
      .json({
        data: tranformedData,
        message: "get data successfully",
        success: true,
      });
  } catch (err) {
    next(err);
  }
};
exports.oneUser = async (req, res, next) => {
  try {
  const id = req.params.id;
    let userData = await User.findOne({
      where: {id: id},
      include:Account  
  });
userData = JSON.stringify(userData);
userData = JSON.parse(userData);
userData.image = `${process.env.APP_DOMAIN}/images/resources/profile_images/${
  userData.image
}`;

userData.Account.display_image = `${process.env.APP_DOMAIN}/images/resources/display_images/${
  userData.Account.display_image
}`;
   
    return res
      .status(200)
      .json({
        data: userData,
        message: "get data successfully",
        success: true,
      });
  } catch (err) {
    next(err);
  }
};
