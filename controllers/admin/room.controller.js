
import {Room,sequelize,Type} from "../../models";
import {postUpdateSchema,updateRoomUploadSchema} from "../../validators/admins/room.validator";
import createHttpError from 'http-errors';
import {setFloderName} from "../../constants/floderName";
import fs from "fs";
import {showTransformer,aShowTransformer} from "../../tranformer/room.tranformer";
exports.index = async(req,res,next)=>{
    try{
        let rooms = await Room.findAll({
            include: Type
        });
        rooms = await showTransformer(rooms);
       
        return res.status(200).json({
            success:true,
            data:rooms
        })
    }catch(err){
       
        next(err);
    }
}






exports.show = async(req,res,next)=>{
    try{
        const validateResult = req.params.id;
        let room = await Room.findByPk(validateResult,{
            include: Type
        });
        room = await aShowTransformer(room);
        return res.status(200).json({
            success:true,
            data:room
        })
    }catch(err){
        next(err);
    }
}
exports.post = async(req,res,next)=>{
    if(!req.files[0]){
    return res.status(400).json({
        "message":"room_images is required",
        "success":false
        });
    }
  
    setFloderName();
    try{
        const validateResult = await postUpdateSchema.validateAsync(req.body);
        const type = await Type.findByPk(validateResult.type_id);
        if(!type){
            throw createHttpError.NotFound("Type not found");
        }
        const room = await Room.create({
             name:validateResult.name,
             price:validateResult.price,
             images_path:req.files[0].folderName,
             type_id:validateResult.type_id
        });
        return res.status(200).json({
            success:true,
            data:room
        });

    }catch(err){
        fs.rmdir(req.files[0].fullFolderName, { recursive: true }, (err) => {
            if (err) {
                next(err);
            }
        
            console.log(`image is deleted!`);
        });
        next(err);
    }

}
exports.update = async(req,res,next)=>{
   return res.status(200).json({ data:req.files})

   let subString = validationResult.delete_image[0].split("/");
        let floderName = subString[subString.length - 2];
        if(req.body.hasOwnProperty("delete_image")){
          for(let image_path of validationResult.delete_image){
            try{
              let sub_image_file_name = image_path.split("/");
              let image_file_name = sub_image_file_name[sub_image_file_name.length-1];
              let path = `${appDir}/public/images/resources/room/${floderName}/${image_file_name}`;
             
              if(!fs.existsSync(path)){
                cb(createError(400, 'Image path does not exist'),null)
              }
            }catch(err){
              console.log(err);
            }
          }
        }
    try{
        let validateResult;
        if(!req.files[0]){
            validateResult = await updateRoomUploadSchema.validateAsync(req.body);
        }
        else{
            validateResult = req.body;
        }
        const type = await Type.findByPk(validateResult.type_id);
        if(!type){
            throw createHttpError.NotFound("Type not found");
        }
        
        
        const room = Room.update({
            name:validateResult.name,
            price:validateResult.price,
            type_id:validateResult.type_id
        },{
            where:{
                id:req.params.id
            }
        });
        if(validateResult.delete_image){

        }
        return res.status(200).json({
            success:true,
            data:room
        });
    }catch(err){
        next(err);
    }

}
exports.delete = async(req,res,next)=>{
    try{
        const room =await Room.destroy({
            where:{
                id:req.params.id
            }
        });
        return res.status(200).json({
            success:true,
            data:room
        })
    }catch(err){
        next(err);
    }
}

exports.roomsWithType = async (req,res,next)=>{
    try{
        const rooms = await Room.findAll({
            include:Type,
        });
        return res.status(200).json({
            success:true,
            data:rooms
        });
    }catch(err){
        next(err);
    }
}



