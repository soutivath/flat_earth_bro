require('dotenv').config();
const { dirname } = require('path');
import { promises } from "fs";
exports.showTransformer = async (data)=>{
    const appDir = dirname(require.main.filename);

   return  await Promise.all(data.map(async room=>{
        let dir = `${appDir}/public/images/resources/room/${room.images_path.toString()}`;
        let allImages = [];
       const files = await promises.readdir(dir);
        
        for(let file of files){
            allImages.push(`${process.env.APP_DOMAIN}/images/resources/room/${room.images_path.toString()}/${file.toString()}`)
        }
        return {
            id:room.id,
            name:room.name,
            createdAt:room.createdAt,
            allImages: allImages,
            is_active:room.is_active,
            electric_motor_number:room.electric_motor_number,
            water_motor_number:room.water_motor_number,
            type:{
                id:room["Type"].id,
                name:room["Type"].name,
                price:room["Type"].price
            },
            
        };
    }));


   
   
}

exports.aShowTransformer = async (room)=>{
    const appDir = dirname(require.main.filename);

  
        let dir = `${appDir}/public/images/resources/room/${room.images_path}`;
        let allImages = [];
       const files = await promises.readdir(dir);
        
        for(let file of files){
            allImages.push(`${process.env.APP_DOMAIN}/images/resources/room/${room.images_path}/${file.toString()}`)
        }
        return {
            id:room.id,
            name:room.name,
            createdAt:room.createdAt,
            allImages: allImages,
            is_active:room.is_active,
            electric_motor_number:room.electric_motor_number,
            water_motor_number:room.water_motor_number,
            type:{
                id:room["Type"].id,
                name:room["Type"].name,
                price:room["Type"].price
            },
            
        };
}


   
   
