
import {sequelize,Payment,PaymentDetail,User,Renting,Room} from "../../models";
import renting from "../../models/renting";

exports.paymentRenting = async (req,res,next)=>{
    try{
        const renting_id = req.params.id;
        const data = await Payment.findAll({
            where:{
                renting_id:renting_id
            },
            include:["payBy","operateBy",PaymentDetail]
        });
        return res.status(200).json({
            message:"get data successfully",
            success:true,
            data:data
        })
    }catch(err){
        next(err);
    }
}

exports.onePayment = async(req,res,next)=>{
    try{
        const payment_detail_id = req.params.id;
        const  data = await PaymentDetail.findOne({
            where:{
                id:payment_detail_id
            },
            include:[Payment]
        });
        return res.status(200).json({
            message:"get data successfully",
            success:true,
            data:data
        });
    }catch(err){
        next(err);
    }
}


exports.payments = async(req,res,next)=>{
    try{
        const data = await Payment.findAll({
            include:[{
                model:Renting,
                include:Room
            },"payBy","operateBy",PaymentDetail]
        });
        return res.status(200).json({
            data:data,
            message:"get data successfully",
            
        });
    }catch(err){
        next(err);
    }
}


exports.paymentInClientRoom = async (req,res,next)=>{
    try{
        const user_id  = req.user.id;
        
    }catch(err){
        next(err);
    }
}