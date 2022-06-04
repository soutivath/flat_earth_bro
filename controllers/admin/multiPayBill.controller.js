import {sequelize,Payment,PaymentDetail} from "../../models";

exports.payMultiBill = async (req,res,next)=>{

    /**
     * {
     *  user_id,
     * renting_id,
     *  bill:[
     *      type
     *      bill_id 
     * ]
     * }
     * 
     * 
     */

    try{
        const validateResult = req.body;
       // const payment_no = 

        await Payment.create({
            
        });

        await PaymentDetail.create({
            
        });
        
    }catch(err){
        next(err);
    }
}

const getRandomId = (min = 0,max=500000)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    const num = Math.floor(Math.random() * (max - min +1))+min;
    return num.toString().padStart(6,"0");
}

const getId = (num) => {
    return num.toString().padStart(6,"0");
}