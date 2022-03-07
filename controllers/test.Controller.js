import {sequelize} from "../models";
import createHttpError from "http-errors";
import {setFloderName} from "../constants/floderName";

const fs = require("fs");
const path = require("path");
const { dirname } = require('path');
import { promises } from "fs";

exports.testMulter = async (req, res,next)=>{
    

    
  //  const files = req.files;
    
try{
    setFloderName();
    
    return res.status(200).json({
        data:"nice",
    })
    const appDir = dirname(require.main.filename);
    let dir = `${appDir}/public/images/resources/room/room1`;
    const files = await promises.readdir(dir);
    const mutation = [];
    for(let file of files){
        mutation.push(`${process.env.APP_DOMAIN}/images/resources/room/room1/${file.toString()}`)
    }
    
    return res.status(200).json({
        data:mutation
    });


}catch(err){
    try{
      fs.unlinkSync(files[0].path)
    }catch(err){
    }
    next(err);
}
}
