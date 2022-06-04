import { sequelize, User, Account } from "../../models";
import JWT from "../../libs/utils/authenticate";
import { hashPassword, compareHashPassword } from "../../libs/utils/bcrypt";
import {
  registerUserSchema,
  loginUserSchema,
} from "../../validators/users/authentication.validator";
import createHttpError from "http-errors";
exports.login = async (req, res, next) => {
  try {
    const validatedResult = await loginUserSchema.validateAsync(req.body);
  
    const account = await Account.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
      },
      include:User
    });
 
    if (!account) {
      throw createHttpError(404, "User not found");
    }

    if (account.User.is_admin != "superadmin") {
      throw createHttpError(400, "Only admin can use this function");
    }
    const isPasswordMatch = compareHashPassword(
      validatedResult.password,
      account.password
    );
    if (!isPasswordMatch) {
      throw createHttpError(403, "Password mismatch");
    }

    const payload = {
      account_id:account.id,
      user_id: account.User.id,
      phoneNumber: account.phoneNumber,
      name: account.User.name,
      display_name: account.display_name,
      is_admin: account.User.is_admin,
    };

    const accessToken = JWT.genAccessJWT(payload);
    const refreshToken = JWT.genRefreshJWT(payload);
    return res.status(200).json({
      success: true,
      message: "login successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
};
