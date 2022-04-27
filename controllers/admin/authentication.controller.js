import { sequelize } from "../../models";
import JWT from "../../libs/utils/authenticate";
import User from "../../models";
import {hashPassword,compareHashPassword} from "../../libs/utils/bcrypt";
import {registerUserSchema,loginUserSchema} from "../../validators/users/authentication.validator";
import createHttpError from "http-errors";
exports.login = async (req, res, next) => {
    
    try{    const validatedResult = await registerUserSchema.validateAsync(req.body);
       
        const user = await User.findOne({
            where:{
                phone_number:validatedResult.phone_number
            }
        });
        if(!user){
           throw createHttpError(404,"User not found");
        }
        const isPasswordMatch = compareHashPassword(validatedResult.password,user.password);
        if(!isPasswordMatch){
           throw createHttpError(403,"Password mismatch");
        }

        const payload = {
            id:user.id,
            phoneNumber:user.phoneNumber
        }

        const accessToken = JWT.genAccessJWT(payload);
        const refreshToken = JWT.genRefreshJWT(payload);
        return res.status(200).json({
            success: true,
            message:"login successfully",
            accessToken:accessToken,
            refreshToken:refreshToken
        });
    }catch(err) {
        next(err);
    }
}

exports.logout = async (req,res,next)=>{
    try{
        
    }
    catch(err) {
        next(err);
    }
}

