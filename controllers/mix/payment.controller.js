
import {sequelize,Payment,PaymentDetail,User,Renting,Room,UserRenting} from "../../models";
import {Op} from "sequelize";

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
exports.oneHeaderPayment = async(req,res,next)=>{
    try{
        const payment_id = req.params.id;
        const  data = await Payment.findOne({
            where:{
                id:payment_id
            },
            include:[{
                model:Renting,
                include:Room
            },"payBy","operateBy",PaymentDetail]
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
        const active = req.query.active;
      
        let userRenting;
        if(active=="true"){

        
         userRenting = await UserRenting.findAll({
            where:{
                user_id:user_id
            },
            include:[{
                model:Renting,
                where:{
                    is_active:true
                }
            }]
        });
    }else if(active=="false"){
        userRenting = await UserRenting.findAll({
            where:{
                user_id:user_id
            },
            include:[{
                model:Renting,
                where:{
                    is_active:false
                }
            }]
        });
    }else{
        userRenting = await UserRenting.findAll({
            where:{
                user_id:user_id
            },
            include:[{
                model:Renting,
                where:{
                    is_active:true
                }
            }]
        });
    }
    let rentingId = [];

    for(let eachRenting of userRenting){
        rentingId.push(eachRenting.Renting.id);
    }


    const paymentData = await Payment.findAll({
        where:{
            renting_id:{
                [Op.in]:rentingId
            }
        },
        include:[{
            model:Renting,
            include:Room
        },"payBy","operateBy",PaymentDetail]
    });

    return res.status(200).json({
        data:paymentData,
        success:true,
        message:"get data successfully"
    });

        
    }catch(err){
        next(err);
    }
}