
import {sequelize,Payment,PaymentDetail,User,Renting} from "../../models";

exports.paymentRenting = async (req,res,next)=>{
    try{
        const renting_id = req.params.id;
        const data = await Renting.findOne({
            where:{
                id:renting_id
            },
            include:[{model:Payment,include:["payBy","operateBy",PaymentDetail]}]
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
            }
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
            include:[Renting,"payBy","operateBy",PaymentDetail]
        });
        return res.status(200).json({
            data:data,
            message:"get data successfully",
            
        });
    }catch(err){
        next(err);
    }
}