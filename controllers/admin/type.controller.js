
import {Type,sequelize} from "../../models";
import {postUpdateSchema} from "../../validators/admins/type.validator";
exports.index = async(req,res,next)=>{
    try{
        const types = await Type.findAll();
        return res.status(200).json({
            success:true,
            data:types
        })
    }catch(err){
        next(err);
    }
}
exports.show = async(req,res,next)=>{
    try{
        const validateResult = req.params.id;
        const type = await Type.findByPk(validateResult);
        return res.status(200).json({
            success:true,
            data:type
        })
    }catch(err){
        next(err);
    }
}
exports.post = async(req,res,next)=>{
   
    
    try{
        const validateResult = await postUpdateSchema.validateAsync(req.body);
        const type = await Type.create({
             name:validateResult.name,
             price:validateResult.price
        });
        return res.status(200).json({
            success:true,
            data:type
        });

    }catch(err){
        next(err);
    }

}
exports.update = async(req,res,next)=>{
   
    try{
        const validateResult = await postUpdateSchema.validateAsync(req.body);
        const type = await Type.update({
            name:validateResult.name,
            price:validateResult.price
        },{
            where:{
                id:req.params.id
            }
        });
      const updatedType = await Type.findOne({
          where:{
              id:req.params.id
          }
      });
        return res.status(200).json({
            success:true,
            data:updatedType
        });
    }catch(err){
        next(err);
    }

}
exports.delete = async(req,res,next)=>{
    try{
        const deletedType = await Type.findOne({
            where:{
                id:req.params.id
            }
        });
        const type =await Type.destroy({
            where:{
                id:req.params.id
            }
        });
        
        return res.status(200).json({
            success:true,
            data:deletedType
        })
    }catch(err){
        next(err);
    }
}



