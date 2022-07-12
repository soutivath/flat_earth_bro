import { sequelize, Renting, User,Bill,Trash,RentingDetail,Room, Sequelize } from "../../models";
import paidType from "../../constants/paidType";
import billType from "../../constants/billType";
import date from "date-and-time";
import {Op} from "sequelize";
exports.userReport = async (req, res, next) => {
  try {
    const userData = await User.findAll({
      where: {
        is_admin:"user",
      },
    });
    return res.status(200).json({
      data:userData,
      message:"get data successfully",
      success:true
    });
  } catch (err) {
    next(err);
  }
};

exports.rentingReport = async (req, res, next) => {
  try {
    let isActive = {};
    if (req.query.isActive) {
      if (req.query.isActive == "true") {
        isActive.is_active = 1;
      } else {
        isActive.is_active = 0;
      }
    }
    const rentingData = await Renting.findAll({
      where: isActive,
      include: [User,"staff",Room],
    });

    return res.status(200).json({
      data: rentingData,
      message: "get report successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.billReport = async (req, res, next) => {
  try {
    const from = date.parse(req.query.from,"YYYY-MM-DD");
    const to = date.parse(req.query.to,"YYYY-MM-DD");
    const billType = req.query.billType;
    const isPaid = req.query.isPaid;
  
 
    console.log(".......................................................");
    const billData = await Bill.findAll({
      where: {
        is_pay: isPaid,
        bill_type: billType,
       
          createdAt:{
            [Op.gte]:from,
            [Op.lte]:to
          },
          
          // createdAt: {
          //     [Op.between]: [from, to]
          // }
     
      },
      include: [
        "bill_pay_by",
        "bill_operate_by",
        {
          model: Renting,
          include:[Room,User],
        },
      ],
    });
    console.log(".......................................................");
    return res.status(200).json({
      data: billData,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.trashReport = async (req,res,next)=>{
    try {
        const from = date.parse(req.query.from,"YYYY-MM-DD");
        const to = date.parse(req.query.to,"YYYY-MM-DD");
      
        const isPaid = req.query.isPaid;
        // const trashData = await Trash.findAll({
        //   where:{
        //     is_trash_pay: isPaid,
        //   },
        //   include: [
        //     {
        //       model: RentingDetail,
        //       as:"rentingdetail",
        //       where: {
        //         [Op.or]: [{
        //           start_date: {
        //               [Op.between]: [from, to]
        //           }
        //       }, {
        //           end_date: {
        //               [Op.between]: [from, to]
        //           }
        //       }]
        //       },
        //     },
        //   ],
        // });

        const [results, metadata] = await sequelize.query("SELECT trashes.id AS trash_id,trashes.is_trash_pay,trashes.trash_pay_amount,trashes.rentingdetail_id,rentingdetails.start_date,rentingdetails.end_date,rentByUser.id as user_id,rentByUser.name AS user_name,rentByUser.phoneNumber,operateByStaff.id AS staff_id,operateByStaff.name AS staff_name,rooms.id AS room_id,rooms.name AS room_name ,payments.proof_of_payment FROM trashes "
        +"LEFT JOIN rentingdetails ON trashes.rentingdetail_id = rentingdetails.id "
        +"LEFT JOIN rentings ON rentingdetails.renting_id = rentings.id "
        +"LEFT JOIN rooms ON rentings.room_id = rooms.id "
        +"LEFT JOIN users AS rentByUser ON rentings.user_id = rentByUser.id "
        +"LEFT JOIN users AS operateByStaff ON rentings.staff_id = operateByStaff.id "
        +"LEFT JOIN payments ON trashes.proof_of_payment = payments.id "
        +"WHERE trashes.is_trash_pay = ? AND (rentingdetails.start_date BETWEEN ? AND ? OR `rentingdetails`.`end_date` BETWEEN ? AND ?)",{
          replacements:[isPaid,from,to,from,to]
        });
      
    
        return res.status(200).json({
          data: results,
          message: "get data successfully",
          success: true,
        });
      } catch (err) {
        next(err);
      }

      // "SELECT `Trash`.`id`, `Trash`.`is_trash_pay`, `Trash`.`trash_pay_amount`, `Trash`.`rentingdetail_id`, `Trash`.`proof_of_payment`, `Trash`.`pay_by`, `Trash`.`operate_by`, `Trash`.`createdAt`, `Trash`.`updatedAt`, `rentingdetail`.`id` AS `rentingdetail.id`, `rentingdetail`.`renting_id` AS `rentingdetail.renting_id`, `rentingdetail`.`start_date` AS `rentingdetail.start_date`, `rentingdetail`.`end_date` AS `rentingdetail.end_date`, `rentingdetail`.`is_renting_pay` AS `rentingdetail.is_renting_pay`, `rentingdetail`.`renting_pay_amount` AS `rentingdetail.renting_pay_amount`, `rentingdetail`.`fine` AS `rentingdetail.fine`, `rentingdetail`.`proof_of_payment` AS `rentingdetail.proof_of_payment`, `rentingdetail`.`createdAt` AS `rentingdetail.createdAt`, `rentingdetail`.`updatedAt` AS `rentingdetail.updatedAt`, `rentingdetail`.`pay_by` AS `rentingdetail.pay_by`, `rentingdetail`.`operate_by` AS `rentingdetail.operate_by` FROM `trashes` AS `Trash` 
      // INNER JOIN `rentingdetails` AS `rentingdetail` ON `Trash`.`rentingdetail_id` = `rentingdetail`.`id` AND (`rentingdetail`.`start_date` BETWEEN '2022-01-01' AND '2022-07-01' OR `rentingdetail`.`end_date` BETWEEN '2022-01-01' AND '2022-07-01') WHERE `Trash`.`is_trash_pay` = 'true'"
}


exports.rentingPayReport = async (req,res,next)=>{
    try {
        const from = date.parse(req.query.from,"YYYY-MM-DD");
        const to = date.parse(req.query.to,"YYYY-MM-DD");
        const isPaid = req.query.isPaid;
        
    
        const rentingDetail = await RentingDetail.findAll({
          where: {
            is_renting_pay: isPaid,
            [Op.or]: [{
              start_date: {
                  [Op.between]: [from, to]
              }
          }, {
              end_date: {
                  [Op.between]: [from, to]
              }
          }]
          },
          include: [
           
            "renting_pay_by",
            "renting_operate_by",
            {
              model: Renting,
              include:[Room,User]
             
            },
          ],
        });
    
        return res.status(200).json({
          data: rentingDetail,
          message: "get data successfully",
          success: true,
        });
      } catch (err) {
        next(err);
      }
}

exports.rentingNotPayReport = async (req,res,next)=>{
  try{
    let activeRenting = await Renting.findAll({
      where:{
        is_active:1,
      },
      include:[
        User,
        Room
      ]
    });
    activeRenting = JSON.stringify(activeRenting);
    activeRenting = JSON.parse(activeRenting);

    let reportData = [];

    for(let i=0;i<activeRenting.length;i++){
      let trashCount = 0;
      let rentingDetailCount = 0;
      let billWaterCount = 0;
      let billElectricCount = 0;

       billWaterCount = await Bill.count({
        where:{
          renting_id:activeRenting[i].id,
          is_pay:paidType.UNPAID,
          bill_type:billType.WATER
        }
      });
       billElectricCount = await Bill.count({
        where:{
          renting_id:activeRenting[i].id,
          is_pay:paidType.UNPAID,
          bill_type:billType.ELECTRIC
        }
      });
      

      const [results, metadata] = await sequelize.query(
        "SELECT rentingdetails.id AS rentingdetail_id,rentingdetails.is_renting_pay,trashes.id AS trash_id,trashes.is_trash_pay,rentingdetails.start_date,rentingdetails.end_date"
        +" FROM rentingdetails LEFT JOIN trashes ON rentingdetails.id = trashes.rentingdetail_id WHERE rentingdetails.renting_id = ? AND (trashes.is_trash_pay = 'unpaid' OR rentingdetails.is_renting_pay = 'unpaid' )"
      ,{
        replacements:[activeRenting[i].id]
      });
   
      for(let eachResult of results){
        if(date
          .subtract(
           new Date(),
            date.parse(eachResult.end_date, "YYYY-MM-DD")
          )
          .toDays() <= 0){
            if(eachResult.is_renting_pay=='unpaid'){
              rentingDetailCount++;
            }
    
            if(eachResult.is_trash_pay=='unpaid'){
              trashCount++;
            }
          }
        
      }

      if(trashCount!=0 || rentingDetailCount!=0 || billWaterCount!=0 || billElectricCount!=0){
        let oneObject = {
          id:activeRenting[i].id,
          renting_by:activeRenting[i].User.name,
          phone_number:activeRenting[i].User.phoneNumber,
          trashCount :trashCount,
          rentingDetailCount : rentingDetailCount,
          billWaterCount : billWaterCount,
          billElectricCount : billElectricCount,
          room_name: activeRenting[i].Room.name
        }
        reportData.push(oneObject);
      }


      
    }

    return res.status(200).json({
      data:reportData
    })

  }catch(err){
    next(err);
  }
}