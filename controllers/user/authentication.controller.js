
import { sequelize, User } from "../../models";
import {
  registerUserSchema,
  loginUserSchema,
} from "../../validators/users/authentication.validator";
import { hashPassword, compareHashPassword } from "../../libs/utils/bcrypt";
import createHttpError from "http-errors";
import JWT from "../../libs/utils/authenticate";
import GLOBAL_TOPIC from "../../constants/notificationTopic";
import fs from "fs";
//const firebase = require('firebase-admin');
import * as admin from "firebase-admin";

exports.register = async (req, res, next) => {
  let imageProfile = "default_profile.png";
  const t = await sequelize.transaction();
  try {

    let image = req.files?.[0];

    if (image) {
      imageProfile = req.files[0].filename;
    }

    const validatedResult = await registerUserSchema.validateAsync(req.body);
    const user = await User.findOne({
      where: {
        phoneNumber: validatedResult.phoneNumber,
      },
    });
    if (!user) {
      return res.status(400).json({
        message:
          "This phone number not match in ours record please contect owner",
        data: [],
        success: false,
      });
    }
   
    //check OTP bro -------------->
    let uid;
    let phoneNumber;
    const decodedToken = await admin
      .auth()
      .verifyIdToken(validatedResult.firebaseToken);
      console.log(decodedToken);
      phoneNumber = decodedToken.phone_number;
      uid = decodedToken.uid;
  

    /***
         *  const decodedToken_example = {
                        iss: 'https://securetoken.google.com/app-name...',
                        aud: 'app-name-...',
                        auth_time: 1572513404,
                        user_id: '...id...',
                        sub: '...id...',
                        iat: 1572513405,
                        exp: 1572517005,
                        email: 'user@email.com',
                        email_verified: false,
                        firebase: {identities: {email: [Array]}, sign_in_provider: 'password'},
                        uid: '...id...'
                    };
         * 
         */
    if (phoneNumber != validatedResult.phoneNumber) {
      throw createHttpError.BadRequest("FCM not match with phonenumber");
    }

    //--------------------------->
    const hashedPassword = hashPassword(validatedResult.password);
    const updatedUserPassword = await User.update(
      {
        password: hashedPassword,
        image: imageProfile,
        firebase_uid: uid,
        display_name: validatedResult.display_name,
      },
      {
        where: {
          phoneNumber: validatedResult.phoneNumber,
        },
      },
      {
        transaction: t,
      }
    );
    const payload = {
      id: updatedUserPassword.id,
      phoneNumber: updatedUserPassword.phoneNumber,
    };

    admin
      .messaging()
      .subscribeToTopic([validatedResult.firebaseFCM], user.notification_topic)
      .then((response) => {
        console.log(`${user.name} is subscribeToTopic  ${user.notification_topic}`)
        console.log("Successfully subscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error subscribing to topic:", error);
      });
      admin
      .messaging()
      .subscribeToTopic(
        [validatedResult.firebaseFCM],
        GLOBAL_TOPIC.GLOBAL_TOPIC
      )
      .then((response) => {
        console.log(`${user.name} is subscribeToTopic  ${GLOBAL_TOPIC.GLOBAL_TOPIC}`)
        console.log("Successfully subscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error subscribing to topic:", error);
      });

    const accessToken = JWT.genAccessJWT(payload);
    const refreshToken = JWT.genRefreshJWT(payload);

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "Register successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    await t.rollback();

    try {
      fs.unlinkSync(req.files[0].path);
    } catch (err) {}

    next(err);
  }
};

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
    });
    if (!user) {
      return res.status(400).json({
        message: "This phone number not found in our database",
        success: false,
        data: [],
      });
    }
    if (user.password == null) {
      return res.status(400).json({
        message: "This phone number saved in our record but not registered",
        success: false,
        data: [],
      });
    }
    const isPasswordMatch = compareHashPassword(
      validatedResult.password,
      user.password
    );

    if (isPasswordMatch) {
      const payload = {
        id: user.id,
        phoneNumber: user.phoneNumber,
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


