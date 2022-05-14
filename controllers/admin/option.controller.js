import createHttpError from "http-errors";
import {sequelize,Setting} from "../../models";

exports.editOption  = async (req,res,next) =>{
    try{
        //value name
        const validationResult = req.boy;
        const option = await Setting.findOne({
            where:{
                name:validationResult.name,
            }
        });
        if(!option){
            throw createHttpError(404, "Option not found");
        }
       const settingID = await Setting.update({
           value:validationResult.value,
           where:{
               name:validationResult.name
           }
       });
       const updatedData = await Setting.findOne({
           where:{
               id:settingID
           }
       })

       return res.status(200).json({
           data:updatedData,
           message:"Updated option successfully",
           success:true
       });
    }catch(err){
        next(err);
    }
}


exports.getOption = async (req,res,next)=>{
    try{
        const option = await Setting.findAll();
        if(!option){
            throw createHttpError(404, "Option not found");
        }
        return res.status(200).json({
            data:option,
            message:"get data successfully",
            success:true
        });
    }catch(err){
        next(err);
    }
}
exports.showOption = async (req,res,next)=>{
    try{
        const id = req.params.id;
        const option = await Setting.fineOne({
            where:{
                id:id
            }
        });
        if(!option){
            throw createHttpError(404, "Option not found");
        }
        return res.status(200).json({
            data:option,
            message:"get data successfully",
            success:true
        });
      
    }catch(err){
        next(err);
    }
}
