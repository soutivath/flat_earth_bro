
require("dotenv").config();
const { dirname } = require("path");

exports.oneBill = async (data)=>{

}

exports.bills = (data)=>{
 
    
    let billsData = [];
    data.map(bill=>{
    //    let dir = `${appDir}/public/images/resources/bills/${bill.image_path}`;
       let image  = `${process.env.APP_DOMAIN}/images/resources/bills/${
        bill.image_path
      }`;
        let aBill= {
            id: bill.id,
            image_path: image,
            price: bill.price,
            bill_type: bill.bill_type,
            is_pay: bill.is_pay,
            renting_id: bill.renting_id,
            is_user_read: bill.is_user_read,
           // pay_by: bill.pay_by,
           bill_pay_by: {
            id: 3,
            name: bill.bill_pay_by.name,
            phoneNumber: bill.bill_pay_by.phoneNumber,
            personal_card_no: bill.bill_pay_by.personal_card_no,
        },
        bill_operate_by: {
            id: 1,
            name: bill.bill_operate_by.name,
            phoneNumber: bill.bill_operate_by.phoneNumber,
            personal_card_no: bill.bill_operate_by.personal_card_no,
        },
            createdAt: bill.createdAt,
            updatedAt: bill.updatedAt
            
        };
        billsData.push(aBill);
    });
    return billsData;
}