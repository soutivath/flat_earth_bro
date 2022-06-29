import { sequelize,UserRenting,Renting,Room,Type} from "../../models";
import {viewRentingWithDetail} from "../../tranformer/userViewRenting.tranformer";
import {Op} from "sequelize";
import createHttpError from "http-errors";
//get where active
exports.getCurrentRenting = async (req,res,next)=>{
    try{
      
        const renting = await UserRenting.findAll({
            where:{
                user_id:req.user.id
            },
            include:[{
                model:Renting,
                include:Room,
                where:{
                    is_active:true
                }
            }]
        });
       
        if (typeof renting == 'undefined' || renting.length <= 0) {
            return res.status(404).json({message:"your data not found in our record",data:[],success:false});
        }
        return res.status(200).json({
            data:renting,
            message:"get data successfully",
            success:true
        });
    }catch(err){
        next(err);
    }
}

//get all renting by user
exports.getAllRenting = async (req,res,next)=>{
    try{
        const renting = await RentingDetail.findAll({
            where:{
                user_id:req.user.id
            },
            include:[{model:Renting,include:Room}]
        });
        if(typeof renting == 'undefined' || renting.length == 0){
            return res.status(404).json({message:"your data not found in our record",data:[],success:false})
        }
        return res.status(200).json({
            data:renting,
            message:"get data successfully",
            success:true
        });
        
    }catch(err){
        next();
    } 
}

exports.getRentingDetail = async (req,res,next)=>{
    try{
        let auth_user_id = req.user.id;
        let renting_id = req.params.id;

        
        const renting = await UserRenting.findOne({
            where:{
                [Op.and] : [{user_id:auth_user_id},{renting_id:renting_id}]
            },
            include:[{
                model:Renting,
                include:[
                    {
                        model:Room,
                        include:Type
                    }
                ]
            }]
           
        });

        if(!renting){
            throw createHttpError(404, "Renting not found or u not rent this room");
        }

    
      
      let tranformedData = await viewRentingWithDetail(renting);

        
        return res.status(200).json({
            data:tranformedData,
            message:"get data successfully",
            success:true
        });
    }catch(err){
        next(err);
    }
}