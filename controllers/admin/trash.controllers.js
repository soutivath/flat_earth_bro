import {sequelize, sequlize} from '../../models'
import { Op } from "sequelize";
import price from "../../constants/price"
import createHttpError from 'http-errors';
import {payTrashSchema} from '../../validators/admins/trash.validator';
// count people in renting and calculate price 
exports.payTrash = async(req,res,next) => {
    const t = await sequelize.transaction();
    const validationResult = await payTrashSchema.validateAsync(req.body);
    try{
        const renting_detail = await RentingDetail.findByPk(validationResult.renting_detail_id);
        if(!renting) createHttpError.NotFound("Renting not found");
        const userRentings = await UserRentings.count({
            where:{
                renting_id:validationResult.renting_id
            }
        });
        if(userRentings<=0){
            return res.status(404).json({message:"Renting result not found or no user in renting list"});
        }
        let allTrashPrice = userRentings*price.ROOM_PRICE;
        await RentingDetail.update({
            is_trash_pay:true,
            trash_pay_amount:allTrashPrice            
        },{
            where: {
                id:renting_detail.id
            }
        },{
            transaction:t
        });
        return res.status(200).json({
            "message":"Trash pay successfully",
            "success":true
        });


        /**
         * 
         where: {
        [Op.and]: [
          { questionId: req.params.id },
          { nextQuestion: validationResult.nextQuestion_id },
        ],
      },
         */
    }catch(err){
        await t.rollback();
        next(err);
    }

}

