import { sequelize,User } from "../../models";

import {randomTopicString} from "../../libs/utils/randomString";
import {postEditAdminSchema,addUserSchema} from "../../validators/admins/user.validator";
import {compareHashPassword,hashPassword} from "../../libs/utils/bcrypt";
import { response } from "express";

exports.editAdmin = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {

        const validatedResult = await postEditAdminSchema.validateAsync(req.body);
        const updatedUser  = await User.create({
            name:validatedResult.name,
            password:validatedResult.password,
            image:validatedResult.image,
        },{
            transaction:t
        });
        return res.status(200).json({
            data:updatedUser,
            message:"updated admin successfully",
            success:true
        })
    } catch (error) {
        next(error);
    }
}

exports.addAdmin = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const validatedResult = await postEditAdminSchema.validateAsync(req.body);
        const newAdmin  = await User.create({
            name:validatedResult.name,
            phoneNumber:validatedResult.phoneNumber,
            password:hashPassword(validatedResult.password),
            image:"",
            is_admin:1,
            notification_topic:randomTopicString
        },{
            transaction:t
        });
        return res.status(201).json({
            data:newAdmin,
            message:"Create admin successfully",
            success:true
        });
    } catch (error) {
        await t.rollback();
        next(error);
    }
}

exports.deleteUser = async (req,res,next)=>{
    try{
        
    }catch(err){
        next(err);	
    }
}

exports.addUser = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validatedResult = await addUserSchema.validateAsync(req.body);
        const newUser = await User.create({
            name:validatedResult.name,
            phoneNumber:validatedResult.phoneNumber,
            password:"",
            image:"",
            is_admin:0
        },{
            transaction:t
        });
        return res.status(200).json(
            {
                message:"Add user successfully",
                data:newUser,
                success:true
            }
            
        );
    }catch(err){
        await t.rollback();
        next(err);
    }
}

exports.logout = async (req,res,next)=>{

}