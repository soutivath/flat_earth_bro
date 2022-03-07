import createHttpError from 'http-errors';
import {sequelize,Renting,Bill} from '../../models'
import {addBillSchema,billOperateSchema} from '../../validators/admins/bill.validator'
exports.addBill = async (req,res,next) => {
    const t = await sequelize.transaction();
    try{
        const validatedResult = await addBillSchema.validateAsync(req.body);
        const checkRenting = await Renting.findByPk(validatedResult.renting_id);
        if(!checkRenting) {
            createHttpError.notFound("Renting not found");
        }
        const newBill = await Bill.create({
            image_path:"",
            price:validatedResult.price,
            bill_type:validatedResult.bill_type,
            is_pay:false,
            renting_id:validatedResult.renting_id,
            is_user_read:false,
        });

        return res.status(200).json({
            data:newBill,
            message:"Bill created successfully",
            success:true
        });
    }catch(err){
        await t.rollback();
    next(err);
    }
}

exports.payBill = async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        const validatedResult = await billOperateSchema.validateAsync(req.body);
        const checkBill = await Bill.findByPk(validatedResult.bill_id);
        if(!checkBill) {
            createHttpError.notFound("Bill not found");
        }
        const newBill = await Bill.update({
            is_pay:true,
        },
        {
            where:{
                id:validatedResult.bill_id,
            }
        });

        return res.status(200).json({
            data:newBill,
            message:"Bill created successfully",
            success:true
        });
        
    }catch(err){
        await t.rollback();
        next(err);
    }
}

exports.updateBill = async (req,res,next) => {
    const t = await sequelize.transaction();
    try{
        const validatedResult = await billOperateSchema.validateAsync(req.body);
        const checkBill = await Bill.findByPk(validatedResult.bill_id);
        if(!checkBill) {
            createHttpError.notFound("Bill not found");
        }
        const newBill = await Bill.update({
            image_path:"",
            price:validatedResult.price,
            bill_type:validatedResult.bill_type,
            is_pay:false,
        },{
            where:{
                id:validatedResult.bill_id
            }
        });

        return res.status(200).json({
            data:newBill,
            message:"Bill created successfully",
            success:true
        });
    }catch(err){
        await t.rollback();
    next(err);
    }
}

exports.deleteBill = async (req,res,next) => {
    const t = await sequelize.transaction();
    try{
        const validatedResult = await billOperateSchema.validateAsync(req.body);
        const checkBillExisting = await Bill.findByPk(validatedResult.id);
        if(!checkBillExisting) createHttpError.notFound("Bill not found");
        const bill = await Bill.destroy({
            where:{
                id:validatedResult.bill_id
            }
        });
        return res.status(200).json({success:true,data:bill});
    }catch(err){
        await t.rollback();
        next(err);
    }
}
