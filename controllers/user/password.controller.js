
import * as admin from "firebase-admin";
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