import { sequelize,User,Account } from "../../models";

exports.getCurrentProfile = async (req,res,next)=>{
    try{
    let user = await User.findOne({
        where:{
            id:req.user.id
        },
        include:Account,
        plain:true
    });

 
     user.image =user.getOnlinePath();
     user.Account.display_image = user.Account.getOnlineDisplayImage();

    return res.status(200).json({
        data:user,
        message:"get data successfully",
        success:true
    });
    }catch(err){
        next(err);
    }
}