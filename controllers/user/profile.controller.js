import { sequelize ,User} from "../../models";
import {profileValidator} from "../../validators/users/profile.validator";
import {hashPassword,compareHashPassword} from "../../libs/utils/bcrypt";
import createHttpError from "http-errors";
import userImage from "../../tranformer/images/user.tranformer";
exports.editProfile = async (req,res,next)=>{
    try{
      
        const user = await User.findOne({
            where:{
                id:req.user.id
            }
        });
        let option = {};

        if(req.body.name){
            option.name = req.body.name
        }

        if(req.files[0]){
            let fileName = req.file[0].filename;
            let destination = req.file[0].destination;
            let oldImage = req.file[0].destination+"/"+user.image;
            option.image = fileName;
        if (!fs.existsSync(path)) {
            cb(createHttpError(404, `${image_path} not found`));
          }
          try {
            fs.unlinkSync(oldImage);
          } catch (err) {
            console.log(err);
          }
            

        }
      
      
      
        await User.update(option,{
            where:{
                id:req.user.id
            }
        });
        return res.status(200).json({
            data:[],
            message:"update profile successfully",
            success:true
        });
    }catch(err){
        next(err);
    }
}

exports.resetPassword = async (req,res,next)=>{
    try{
        const body = req.body;
        const user = await User.findOne({
            where:{
                id:req.user.id
            }
        });
        const isPasswordMatch = compareHashPassword(body.password,user.password);
        if(!isPasswordMatch){
            throw createHttpError(403,"Invalid password");
        }
        const hashedPassword = hashedPassword(body.password);
        await User.update({
           password:hashedPassword
        },{
            where:{
                id:req.user.id
            }
        });
        return res.status(200).json({
            data:[],
            message:"Update password successfully",
            success:true
        });
    }catch(err){
        next(err);
    }

}

exports.getCurrentProfile = async (req,res,next)=>{
    try{
        const currentAuthId = req.user.id;
        const currentUserData = await User.findOne({
            where:{
                id:currentAuthId
            },
            plain: true,
        });
        const imageFullPath = userImage(currentUserData.image);
        currentUserData.image = imageFullPath;
        return res.status(200).json({
            data:currentUserData,
            message:"get data successfully",
            success:true
        });
    }catch(err){
        next(err);
    }
}

exports.logout = async ()=>{
    
}
