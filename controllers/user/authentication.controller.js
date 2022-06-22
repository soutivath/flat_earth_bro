
import { sequelize, User,Account } from "../../models";
import {
  registerUserSchema,
  loginUserSchema,
  loginFCMUserSchema
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
      include:Account
    });
    if (!user) {
     throw createHttpError(404, "User not found");
    }
    
    if(user.Account.password!=null){
      throw createHttpError(400, "This account already exists");
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
    await Account.update(
      {
        password: hashedPassword,
        display_image: imageProfile,
        uid: uid,
        display_name: validatedResult.display_name,
        global_option:1,
        personal_option:1,
        fcm:validatedResult.firebaseFCM
      },
      {
        where: {
          user_id: user.id,
        },
        transaction: t,
      },
    );
  

    const payload = {
      account_id:user.Account.id,
      user_id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      display_name: validatedResult.display_name,
      is_admin: user.is_admin,
    };

    admin
      .messaging()
      .subscribeToTopic([validatedResult.firebaseFCM], user.Account.notification_topic)
      .then((response) => {
        console.log(`${user.name} is subscribeToTopic  ${user.Account.notification_topic}`)
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
    const validatedResult = await loginFCMUserSchema.validateAsync(req.body);
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

    if(user.is_admin=="user"){
     if(user.Account.personal_option){
      admin
      .messaging()
      .subscribeToTopic([user.Account.fcm], user.Account.notification_topic)
      .then((response) => {
        console.log(`${user.name} is subscribeToTopic  ${user.Account.notification_topic}`)
        console.log("Successfully subscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error subscribing to topic:", error);
      });
     }
     else{
      admin
      .messaging()
      .unsubscribeFromTopic([user.Account.fcm], user.Account.notification_topic)
      .then((response) => {
        console.log(`${user.name} is unsubscribeToTopic  ${user.Account.notification_topic}`)
        console.log("Successfully unsubscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error unsubscribing to topic:", error);
      });
     }
     
     if(user.Account.global_option){
      admin
      .messaging()
      .subscribeToTopic(
        [user.Account.fcm],
        GLOBAL_TOPIC.GLOBAL_TOPIC
      )
      .then((response) => {
        console.log(`${user.name} is subscribeToTopic  ${GLOBAL_TOPIC.GLOBAL_TOPIC}`)
        console.log("Successfully subscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error subscribing to topic:", error);
      });
     }
     else{
      admin
      .messaging()
      .unsubscribeFromTopic([user.Account.fcm], GLOBAL_TOPIC.GLOBAL_TOPIC)
      .then((response) => {
        console.log(`${user.name} is unsubscribeToTopic  ${GLOBAL_TOPIC.GLOBAL_TOPIC}`)
        console.log("Successfully unsubscribed to topic:", response);
      })
      .catch((error) => {
        console.log("Error unsubscribing to topic:", error);
      });
     }

    }

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



