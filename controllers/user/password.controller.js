
import * as admin from "firebase-admin";
import createHttpError from "http-errors";
import {User,sequelize,Account} from "../../models/";
import { hashPassword, compareHashPassword } from "../../libs/utils/bcrypt";
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
        throw createHttpError.BadRequest("firebaseToken is required");
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
  
      const account = await Account.findOne({
        where: {
          uid: uid,
        },
      });
      if(!account) throw createHttpError.NotFound("Account not found");
      // const isPasswordMatch = compareHashPassword(body.old_password, user.password);
      // if (!isPasswordMatch) {
      //   throw createHttpError(403, "Invalid password");
      // }
      const hashedPassword = hashPassword(body.new_password);
      await Account.update(
        {
          password: hashedPassword,
        },
        {
          where: {
            id:account.id,
          },
        }
      );
  
  
      return res.status(200).json({
        data: [],
        message: "Update password successfully",
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };