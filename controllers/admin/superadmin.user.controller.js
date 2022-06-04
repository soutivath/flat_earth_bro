import { sequelize, User,Account } from "../../models";
import {
  postEditAdminSchema,
  addUserSchema,
  adminAddUserSchema,
} from "../../validators/admins/user.validator";
import fs from "fs";
import createHttpError from "http-errors";

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

    let profilePath = user.getProfilePath();

    let option = {};

    option.name = validatedResult.name;
    option.phoneNumber = validatedResult.phoneNumber;
    option.is_admin = validatedResult.is_admin;
    option.personal_card_no = validatedResult.personal_card_no;

    if (req.files[0]) {
      option.image = req.files[0].filename;
    }

    const updatedUser = await User.update(option, {
      where: {
        id: raq.params.id,
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
      data: updatedUser,
      message: "updated admin successfully",
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
        user_id:newAdmin,
      
    },
    {
        transaction: t,
    });


    await t.commit();
    return res.status(201).json({
      data: newAdmin,
      message: "Create admin successfully",
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
  try {
    const userId = req.params.id;
    if(req.user.user_id == userId){
        throw createHttpError(400,"You cannot delete ur account");
    }
    const user = await User.findByPk(userId);
    const userImagePath = user.getProfilePath();

    await user.destroy();
    try {
      fs.unlinkSync(userImagePath);
    } catch (err) {}

    return res.status(200).json({
      data: [],
      success: true,
      message: "Delete user successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    let option = {};
    if (req.query.isAdmin === "true") {
      option.is_admin = { [Op.ne]: "user" };
    } else if (req.query.isAdmin === "false") {
      option.is_admin = "user";
    }
    const userData = await User.findAll({
      where: option,
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
