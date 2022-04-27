import { sequelize,User } from "../../models";

import {randomTopicString} from "../../libs/utils/randomString";
import {postEditAdminSchema,addUserSchema} from "../../validators/admins/user.validator";
import {compareHashPassword,hashPassword} from "../../libs/utils/bcrypt";
import { response } from "express";
import fs from "fs";
import createHttpError from "http-errors";
import {userTranformer} from "../../tranformer/user.tranformer";
exports.editAdmin = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const validatedResult = await postEditAdminSchema.validateAsync(req.body);
       let user = await User.findOne({
           where: {
               id:req.params.id
           }
       });
       if(!user){
           throw createHttpError(404,"User not found");
       }

       let profilePath = user.getProfilePath();

       let option = {};
       option.name = validationResult.name;
       if(req.files[0]){
       
            option.image = req.files[0].filename; 
        
       }
      
        const updatedUser  = await User.update(option,{
            where:{
                id:raq.params.id
            },
            transaction:t
        });
        if(profilePath!="default_profile.png"){
            try {
                fs.unlinkSync(profilePath);
              } catch (err) {}
        }
        return res.status(200).json({
            data:updatedUser,
            message:"updated admin successfully",
            success:true
        })
    } catch (error) {
        try {
            fs.unlinkSync(
            req.files[0].path
            );
          } catch (err) {}
        await t.rollback();
        next(error);
    }
}

exports.addAdmin = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        let imageProfile = "default_profile.png";
       
        if(req.files[0]){
            imageProfile = req.files[0].filename; 
        }
        const validatedResult = await addUserSchema.validateAsync(req.body);
        const newAdmin  = await User.create({
            name:validatedResult.name,
            phoneNumber:validatedResult.phoneNumber,
            password:hashPassword(validatedResult.password),
            image:imageProfile,
            is_admin:1,
            notification_topic:randomTopicString()
        },{
            transaction:t
        });
        await t.commit();
        return res.status(201).json({
            data:newAdmin,
            message:"Create admin successfully",
            success:true
        });
    } catch (error) {
        try {
            fs.unlinkSync(
            req.files[0].path
            );
          } catch (err) {}
        await t.rollback();
        next(error);
    }
}

exports.deleteUser = async (req,res,next)=>{
    try{
        const userId = req.params.id;
        // if(req.user.id == userId){
        //     throw createHttpError(400,"You cannot delete ur account");
        // }
        const user = await User.findByPk(userId);
        const userImagePath =  user.getProfilePath();
      
        await user.destroy();
        try {
            fs.unlinkSync(
            userImagePath
            );
          } catch (err) {}

          return res.status(200).json({
              data:[],success:true,message:"Delete user successfully"
          });
    }catch(err){
        next(err);	
    }
}

exports.addUser = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const imageProfile = "default_profile.png";
        const validatedResult = await addUserSchema.validateAsync(req.body);
        const newUser = await User.create({
            name:validatedResult.name,
            phoneNumber:validatedResult.phoneNumber,
            password:"",
            image:imageProfile,
            is_admin:0,
            notification_topic:randomTopicString()
        },{
            transaction:t
        });
        await t.commit();
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

exports.getUser = async (req,res,next)=>{
    try{
        let option ={};
        if(req.query.isAdmin==="true"){
            option.is_admin = true;
        }else if(req.query.isAdmin==="false"){
            option.is_admin = false;
        }
        const userData = await User.findAll({
            where:option
        });
        const tranformedData = userTranformer(userData);
        return res.status(200).json({data:tranformedData,message:"get data successfully",success:true});
     
    }catch(err){
        next(err);
    }
}


