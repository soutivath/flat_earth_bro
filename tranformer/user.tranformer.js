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
            phoneNumber: user.phoneNumber,
            image: image,
            is_admin: user.is_admin,
            notification_topic: user.notification_topic,
            firebase_uid: user.firebase_uid,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
            
        };
        userData.push(oneUserData);
    });
    return userData;
}

