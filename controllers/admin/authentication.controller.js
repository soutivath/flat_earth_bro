import { sequelize, User, Account } from "../../models";
import JWT from "../../libs/utils/authenticate";
import { hashPassword, compareHashPassword } from "../../libs/utils/bcrypt";
import {
  registerUserSchema,
  loginUserSchema,
} from "../../validators/users/authentication.validator";
import createHttpError from "http-errors";
// exports.login = async (req, res, next) => {
//   try {
//     const validatedResult = await loginUserSchema.validateAsync(req.body);
  
//     const account = await Account.findOne({
//       where: {
//         phoneNumber: validatedResult.phoneNumber,
//       },
//       include:User
//     });
 
//     if (!account) {
//       throw createHttpError(404, "User not found");
//     }

//     // if (account.User.is_admin != "superadmin") {
//     //   throw createHttpError(400, "Only admin can use this function");
//     // }
//     const isPasswordMatch = compareHashPassword(
//       validatedResult.password,
//       account.password
//     );
//     if (!isPasswordMatch) {
//       throw createHttpError(403, "Password mismatch");
//     }

//     const payload = {
//       account_id:account.id,
//       user_id: account.User.id,
//       phoneNumber: account.phoneNumber,
//       name: account.User.name,
//       display_name: account.display_name,
//       is_admin: account.User.is_admin,
//     };

//     const accessToken = JWT.genAccessJWT(payload);
//     const refreshToken = JWT.genRefreshJWT(payload);
//     return res.status(200).json({
//       success: true,
//       message: "login successfully",
//       accessToken: accessToken,
//       refreshToken: refreshToken,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
exports.login = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const validatedResult = await loginUserSchema.validateAsync(req.body);
    //check OTP bro -------------->
    let uid;
    let phoneNumber;
    // firebase
    //   .getAuth()
    //   .verifyIdToken(validatedResult.firebaseFCM)
    //   .then((decodedToken) => {
    //     uid = decodedToken.uid;
    //     phoneNumber = decodedToken.Identifier;
    //   })
    //   .catch((error) => {
    //     throw createHttpError.Unauthorized(error);
    //   });
    // if (phoneNumber != validatedResult.phoneNumber) {
    //   throw createHttpError.BadRequest("FCM not match with phonenumber");
    // }

    //--------------------------->
    const user = await User.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
      },
      include:Account
    });
    if (!user) {
      return res.status(400).json({
        message: "This phone number not found in our database",
        success: false,
        data: [],
      });
    }
    if (user.Account.password == null) {
      return res.status(400).json({
        message: "This phone number saved in our record but not registered",
        success: false,
        data: [],
      });
    }
    const isPasswordMatch = compareHashPassword(
      validatedResult.password,
      user.Account.password
    );

    if (isPasswordMatch) {
      const payload = {
        account_id:user.Account.id,
        user_id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        display_name: user.Account.display_name,
        is_admin: user.is_admin,
      };
      const accessToken = JWT.genAccessJWT(payload);
      const refreshToken = JWT.genRefreshJWT(payload);
      await t.commit();
      return res.status(200).json({
        success: true,
        message: "Login successfully",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      throw createHttpError.Unauthorized(`Invalid password`);
    }
  } catch (err) {
    await t.rollback();
    if (err.isJoi === true) err.status = 422;
    next(err);
  }
};
exports.logout = async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
};
