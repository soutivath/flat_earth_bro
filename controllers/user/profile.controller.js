import { sequelize, User,Account } from "../../models";
import { profileValidator } from "../../validators/users/profile.validator";
import { hashPassword, compareHashPassword } from "../../libs/utils/bcrypt";
import createHttpError from "http-errors";
import {userImage,displayImage} from "../../tranformer/images/user.tranformer";
import fs from "fs";
import * as admin from "firebase-admin";

exports.editProfile = async (req, res, next) => {
  try {
    const validatedResult = await profileValidator.validateAsync(req.body);
    
    let user = await User.findOne({
      where: {
        id: req.user.id,
      },
      include:Account
    });

    let profilePath = user.Account.getDisplayImagePath();
   
    let option = {};

    let image = req.files[0];
    if (image) {
    
      option.display_image = req.files[0].filename;
    }

    if (validatedResult.name) {
      option.display_name = validatedResult.name;
    }


    let newUpdateUser = null;

    if (option != {}) {
     await Account.update(option, {
        where: {
          user_id: req.user.id,
        },
        
      });
      if (profilePath != "default_profile.png") {
        try {
          fs.unlinkSync(profilePath);
        } catch (err) {}
      }

      newUpdateUser = await User.findOne({
        where: { id:user.id },
        include:Account
      });
    }

    return res.status(200).json({
      data: newUpdateUser,
      message: "updated admin successfully",
      success: true,
    });
  } catch (error) {
    try {
      fs.unlinkSync(req.files[0].path);
    } catch (err) {}
    next(error);
  }

  // try{

  //     const user = await User.findOne({
  //         where:{
  //             id:req.user.id
  //         }
  //     });

  //     let option = {};

  //     if(req.body.name){
  //         option.name = req.body.name
  //     }

  //     if(req.files[0]){
  //         let fileName = req.files[0].filename;
  //         let destination = req.files[0].destination;
  //         let oldImage = req.files[0].destination+"/"+user.image;
  //         option.image = fileName;

  //       try {
  //         fs.unlinkSync(oldImage);
  //       } catch (err) {
  //         console.log(err);
  //       }

  //     }

  //     await User.update(option,{
  //         where:{
  //             id:req.user.id
  //         }
  //     });
  //     return res.status(200).json({
  //         data:[],
  //         message:"update profile successfully",
  //         success:true
  //     });
  // }catch(err){
  //     next(err);
  // }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const body = req.body;
    // if(!body.old_password){
    //   throw createHttpError.BadRequest("old_password is required");
    // }
    if(!body.new_password){
      throw createHttpError.BadRequest("new_password is required");
    }
    if(!body.phone_number){
      throw createHttpError.BadRequest("phone number is required");
    }
    if(!body.firebaseToken){
      throw createHttpError.BadRequest("Firebase token is required");
    }
    let phoneNumber = body.phone_number;
    const decodedToken = await admin
    .auth()
    .verifyIdToken(body.firebaseToken);
   let firebase_phoneNumber = decodedToken.phone_number;
   if(firebase_phoneNumber!=phoneNumber){
     throw createHttpError.BadRequest("This is not your firebase token");
   }
    let uid = decodedToken.uid;

    const user = await User.findOne({
      where: {
        firebase_uid: uid,
      },
    });
    // const isPasswordMatch = compareHashPassword(body.old_password, user.password);
    // if (!isPasswordMatch) {
    //   throw createHttpError(403, "Invalid password");
    // }
    const hashedPassword = hashPassword(body.new_password);
    await User.update(
      {
        password: hashedPassword,
      },
      {
        where: {
          id: req.user.id,
        },
      }
    );


    return res.status(200).json({
      data: user,
      message: "Update password successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentProfile = async (req, res, next) => {
  try {
    const currentAuthId = req.user.id;
    const currentUserData = await User.findOne({
      where: {
        id: currentAuthId,
      },
      include:Account,
      plain: true,
    });
    const imageFullPath = userImage(currentUserData.image);
    const displayImageFullPath = displayImage(currentUserData.Account.display_image);
    
    currentUserData.image = imageFullPath;
    currentUserData.Account.display_image = displayImageFullPath;
    return res.status(200).json({
      data: currentUserData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async () => {};
