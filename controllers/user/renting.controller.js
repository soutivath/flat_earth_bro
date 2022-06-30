import { sequelize,UserRenting,Renting,Room,Type,RentingDetail,Bill,Trash} from "../../models";
import date from "date-and-time";
import {viewRentingWithDetail} from "../../tranformer/userViewRenting.tranformer";
import {Op} from "sequelize";
import paidType from "../../constants/paidType";
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


exports.getRentingStatus = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const renting_id = req.params.id;
        let rentingStatus = false;
        let trashStatus = false;
        let billStatus = false;

     
        const renting = await Renting.findOne({
            where:{
                id:renting_id
            },
            include:["users"]
        });
      
      
       for(let eachUser of renting.users){
        if(eachUser.id!=req.user.id){
            throw createHttpError(400,"You not allowed to access this renting detail due ownership")
        }
       }

        if(renting.is_active == 1){
   
            let nowDate = new Date();
            const twoLastedRecord = await RentingDetail.findAll({
              where: {
                renting_id: renting_id,
              },
              limit: 1,
              order: [["end_date", "DESC"]],
              include: Trash,
            });
      
            let endDate = date.parse(twoLastedRecord[0].end_date, "YYYY-MM-DD");
            while(date
              .subtract(
                nowDate,
                endDate
              )
              .toDays() >= 0 )
            {
             
              let newRentingDetailData = await RentingDetail.create({
                start_date: endDate,
                renting_id: renting_id,
                end_date: date.addDays(endDate, 30),
                is_renting_pay: paidType.UNPAID
             
              },{
                transaction:t
              });
              await Trash.create({
                rentingdetail_id: newRentingDetailData.id,
                  is_trash_pay: paidType.UNPAID,
              },{
                transaction:t
              });
              endDate = date.addDays(endDate,30);
            }
      
            await Renting.update({
              end_renting_date:date.format(endDate,"YYYY-MM-DD"),
            },{
              where:{
                id:renting_id
              },
              transaction:t
            });
          }

          await t.commit();




       const rentingDetailData = await RentingDetail.findAll({
        where:{
            renting_id:renting_id,
            end_date:{
                [Op.lte]:new Date()
            },
        },
        include:Trash,
        order: [["end_date", "DESC"]],
       });
      for (let eachData of rentingDetailData){
        if(eachData.is_renting_pay==paidType.UNPAID){
            rentingStatus = true;
        }

        if(eachData.Trash.is_trash_pay == paidType.UNPAID){
            trashStatus = true;
        }
      }

      const billData = await Bill.findAll({
        where:{
            renting_id:renting_id,
            is_pay:paidType.UNPAID
        }
      });

      if(billData[0]){
        billStatus = true;
      }

      return res.status(200).json({
        data:{
            rentingStatus:rentingStatus,
            trashStatus:trashStatus,
            billStatus:billStatus
        },
        message:"get data successfully",
        success:true
      });
       
    }catch(err){
        await t.rollback();
        next(err);
    }
}