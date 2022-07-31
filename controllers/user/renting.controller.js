import { sequelize,UserRenting,Renting,Room,Type,RentingDetail,Bill,Trash} from "../../models";
import date from "date-and-time";
import {viewRentingWithDetail} from "../../tranformer/userViewRenting.tranformer";
import {Op} from "sequelize";
import paidType from "../../constants/paidType";
import createHttpError from "http-errors";
import {showTransformer} from "../../tranformer/room.tranformer";
import { promises } from "fs";
require('dotenv').config();
const { dirname } = require('path');
//get where active
exports.getCurrentRenting = async (req,res,next)=>{
    try{
      
        let renting = await UserRenting.findAll({
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
        renting = JSON.stringify(renting);
        renting =JSON.parse(renting);
        
   
        for(let i = 0 ;i<renting.length;i++) {
            const appDir = dirname(require.main.filename);
                 let dir = `${appDir}/public/images/resources/room/${renting[i].Renting.Room.images_path.toString()}`;
                
                 let allImages = [];
                const files = await promises.readdir(dir);
                 for(let file of files){
                     allImages.push(`${process.env.APP_DOMAIN}/images/resources/room/${renting[i].Renting.Room.images_path.toString()}/${file.toString()}`)
                 }
                


            renting[i].Renting.Room.allImage = allImages;
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
          await t.commit();




      

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

exports.getBillByRenting = async (req,res,next)=>{
    try{
        const renting_id = req.params.id;
        const billData = await Bill.findAll({
            where:{
                renting_id:renting_id
            }
        });
        return res.status(200).json({
            data:billData,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}
exports.getBillById = async (req,res,next)=>{
    try{
        const bill_id = req.params.id;
        const billData = await Bill.findOne({
            where:{
                id:bill_id
            },
            include:["bill_pay_by","bill_operate_by"]
        });
        return res.status(200).json({
            data:billData,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}
exports.getRentingDetailByRenting = async (req,res,next)=>{
    try{
        const renting_id = req.params.id;
        const rentingdetailData = await RentingDetail.findAll({
            where:{
                renting_id:renting_id
            },

        });
        return res.status(200).json({
            data:rentingdetailData,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}
exports.getRentingDetailDetailById = async (req,res,next)=>{
    try{
        const renting_detail_id = req.params.id;
        const rentingdetaildata = await RentingDetail.findOne({
            where:{
                id:renting_detail_id
            },
            include:["renting_pay_by","renting_operate_by"]
        });
        return res.status(200).json({
            data:rentingdetaildata,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}
exports.getTrashByRenting = async (req,res,next)=>{
    try{
        const renting_id = req.params.id;
        const rentingData = await Renting.findOne({
            where:{
                id:renting_id
            },
            include:[{model:RentingDetail,include:[{model:Trash,include:["trash_operate_by","trash_pay_by"]}]}]
        });
        let trashArray = [];
       
        for(let eachData of rentingData.RentingDetails){
            trashArray.push(eachData.Trash)
        }
        
        return res.status(200).json({
            data:trashArray,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}
exports.getTrashById = async (req,res,next)=>{
    try{
        const trashID = req.params.id;
        const TrashData = await Trash.findOne({
            where:{
                id:trashID
            },
            include:["trash_operate_by","trash_pay_by"]
        });
        return res.status(200).json({
            data:TrashData,
            message:"get data successfully",
            success:true
        })
    }catch(err){
        next(err);
    }
}