import { Room, sequelize, Type } from "../../models";
import {
  postUpdateSchema,
  updateRoomUploadSchema,
} from "../../validators/admins/room.validator";
import createHttpError from "http-errors";
import { setFloderName ,getRoomPath} from "../../constants/floderName";
import fs from "fs";
import {
  showTransformer,
  aShowTransformer,
} from "../../tranformer/room.tranformer";


const path = require("path");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);

exports.index = async (req, res, next) => {
  try {
    let rooms = await Room.findAll({
      include: Type,
    });
    rooms = await showTransformer(rooms);

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const validateResult = req.params.id;
    let room = await Room.findByPk(validateResult, {
      include: Type,
    });
    if(!room){
      throw createHttpError(404, "Room not found");
    }
    room = await aShowTransformer(room);
    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (err) {
    next(err);
  }
};
exports.post = async (req, res, next) => {
  if (!req.files[0]) {
    return res.status(400).json({
      message: "room_images is required",
      success: false,
    });
  }

  setFloderName();
  try {
    const validateResult = await postUpdateSchema.validateAsync(req.body);
    const type = await Type.findByPk(validateResult.type_id);
    if (!type) {
      throw createHttpError.NotFound("Type not found");
    }
    const room = await Room.create({
      name: validateResult.name,
      images_path: req.files[0].folderName,
      electric_motor_number:validateResult.electric_motor_number,
      water_motor_number:validateResult.water_motor_number,
      type_id: validateResult.type_id,
    });
    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (err) {
    fs.rmdir(req.files[0].fullFolderName, { recursive: true }, (err) => {
      if (err) {
        next(err);
      }

      console.log(`image is deleted!`);
    });
    next(err);
  }
};
exports.update = async (req, res, next) => {
  try {
    let validateResult = await updateRoomUploadSchema.validateAsync(req.body);
  
let option = {};
    let room = await Room.findOne({
      where:{
        id:req.params.id
      }
    });
  
    if (!room) {
      throw createHttpError(404, "Room not found");
    }
    if(validateResult.type_id){
      const type = await Type.findByPk(validateResult.type_id);
      if (!type) {
        throw createHttpError.NotFound("Type not found");
      }
      option.type_id = type.id;
    }
    
    let floderNameWithPath = `${appDir}/public/images/resources/room/${room.images_path}`;
    let toDeleteImages = [];
   
  
    if (req.body.delete_image) {
      for (let image_path of req.body.delete_image) {
        let sub_image_file_name = image_path.split("/");
        let image_file_name =
          sub_image_file_name[sub_image_file_name.length - 1];
        let fullPath = `${floderNameWithPath}/${image_file_name}`;
        if (!fs.existsSync(fullPath)) {
          throw createHttpError(404, `${image_path} not found`);
        }
        toDeleteImages.push(fullPath);
      }
   
    }

    if(validateResult.name){
      option.name = validateResult.name;
    }

    if(validateResult.electric_motor_number){
      option.electric_motor_number = validateResult.electric_motor_number;
    }

    if(validateResult.water_motor_number){
      option.water_motor_number = validateResult.water_motor_number;
    }

    const roomUpdated = await Room.update(
     option,
      {
        where: {
          id: req.params.id,
        },
      }
    );
    if (toDeleteImages != []) {
      for (let toDeleteImage of toDeleteImages) {
        try {
          fs.unlinkSync(toDeleteImage);
        } catch (err) {
          console.log(err);
        }
      }
    }
    const updatedRoom = await Room.findByPk(req.params.id);
    return res.status(200).json({
      success: true,
      data: updatedRoom,
    });
  } catch (err) {
    if (req.files[0]) {
      for (let file of req.files) {
        fs.unlinkSync(file.path);
      }
    }
    next(err);
  }
};
exports.delete = async (req, res, next) => {

  try {
  let room = await Room.findOne({
    where:{
      id:req.params.id
    }
  });
 
  if(!room){
    throw createHttpError(404, "Room not found");
  }
    await Room.destroy({
      where: {
        id: req.params.id,
      },
    });
    
  
    fs.rmdir(room.getRoomPath(), { recursive: true }, (err) => {
      if (err) {
        next(err);
      }

      console.log(`image is deleted!`);
    });
    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (err) {
    next(err);
  }
};

exports.roomsWithType = async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
      include: Type,
    });
    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (err) {
    next(err);
  }
};
