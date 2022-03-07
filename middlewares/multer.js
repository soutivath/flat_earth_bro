import multer from "multer";
import createError from "http-errors";
import { v4 as uuidv4 } from "uuid";
import { setFloderName, getFloderName } from "../constants/floderName";
import {Room} from "../models";


setFloderName();
const fs = require("fs");
const path = require("path");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const fileFilter = async (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(
      createError.BadRequest("Only .png, .jpg and .jpeg format allowed!")
    );
  }
};

const fileName = (req, file, cb) => {
  const uniqueSuffix = Date.now() + "-" + Math.floor(Math.random() * 1e9);
  cb(
    null,
    file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
  );
};

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/public/images/resources/profile_images`);
  },
  filename: fileName,
});

const billStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/public/images/resources/bills_images`);
  },
  filename: fileName,
});

const testStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir =
      `${appDir}/public/images/resources/test/testImage-` + getFloderName();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      req.files[0].floderName = getFloderName();
      console.log(req.files[0]);
    }

    cb(null, dir);
  },
  filename: fileName,
});
const roomStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = `${appDir}/public/images/resources/room/` + getFloderName();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      req.files[0].folderName = getFloderName();
      req.files[0].fullFolderName = dir;
    }

    cb(null, dir);
  },
  filename: fileName,
});






const updateRoomStorage = multer.diskStorage({
  destination: async (req, file, cb) =>{
    try{
      const room = await Room.findByPk(req.params.id);
      if(!room){
        cb(createError(400, 'Room not found'),null)
      }
      let dir= `${appDir}/public/images/resources/room/${room.images_path}//`;
      //cb(null, dir);
      if (!fs.existsSync(dir)) {
        cb(createError(400, 'Floder path does not exist'),null)
      }
    cb(null, dir);

    }catch(err){
      console.error(err);
      cb(createError(500, err),null);
    }
      
   
  },
  filename: fileName,
});

export const profileUpload = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
});
export const billUpload = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
});
export const roomUpload = multer({
  storage: roomStorage,
  fileFilter: fileFilter,
});
export const updateRoomUpload = multer({
  storage: updateRoomStorage,
  fileFilter: fileFilter,
});
export const testUpload = multer({
  storage: testStorage,
  fileFilter: fileFilter,
});
