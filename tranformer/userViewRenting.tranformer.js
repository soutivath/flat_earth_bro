require("dotenv").config();
const { dirname } = require("path");
import { promises } from "fs";

exports.viewRentingWithDetail = async (data) => {
    
  const appDir = dirname(require.main.filename);

  let dir = `${appDir}/public/images/resources/room/${data.Renting.Room.images_path}`;
  let allImages = [];
  const files = await promises.readdir(dir);

  for (let file of files) {
    allImages.push(
      `${process.env.APP_DOMAIN}/images/resources/room/${
        data.Renting.Room.images_path
      }/${file.toString()}`
    );
  }
  let renting = data.Renting;
  let room = data.Renting.Room;
 let type = data.Renting.Room.Type;
  return {
    contract_path:renting.contract_path,
    renting_id: renting.id,
    start_renting_date: renting.start_renting_date,
    end_renting_date: renting.end_renting_date,
    is_active: renting.is_active,
    deposit: renting.deposit,
    createdAt: renting.createdAt,
    updatedAt: renting.updatedAt,
    Room: {
      id: room.id,
      name: room.name,
      is_active: room.is_active,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      allImages: allImages,
      electric_motor_number:room.electric_motor_number,
      water_motor_number:room.electric_motor_number,
      type: {
        id: type.id,
        name: type.name,
        price: type.price,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
      },
    },
  };
};
