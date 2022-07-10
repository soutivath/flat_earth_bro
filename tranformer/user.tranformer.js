require("dotenv").config();
const { dirname } = require("path");
exports.userTranformer = (data)=>{


      let userData = [];
    data.map(user=>{
    //    let dir = `${appDir}/public/images/resources/bills/${bill.image_path}`;
       let image  = `${process.env.APP_DOMAIN}/images/resources/profile_images/${
        user.image
      }`;
        let oneUserData= {
            id: user.id,
            name: user.name,
            surname:user.surname,
            dob:user.dob,
            phoneNumber: user.phoneNumber,
            image: image,
            is_admin: user.is_admin,
            notification_topic: user.notification_topic,
            firebase_uid: user.firebase_uid,
            personal_card_no:user.personal_card_no,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            Account:{
                id: user.Account.id,
                phoneNumber: user.Account.phoneNumber,
                personal_option: user.Account.personal_option,
                global_option: user.Account.global_option,
                notification_topic: user.Account.notification_topic,
                uid: user.Account.uid,
                display_name: user.Account.display_name,
                user_id: user.Account.user_id,
                createdAt: user.Account.createdAt,
                updatedAt: user.Account.updatedAt,
            }
        };
        userData.push(oneUserData);
    });
    return userData;
}

