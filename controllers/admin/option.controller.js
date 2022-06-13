import createHttpError from "http-errors";
import { sequelize, Setting } from "../../models";

exports.editOption = async (req, res, next) => {
  try {
    //value name
    const settingId = req.params.id;
    const body = req.body;
    
    if(!body.name || !body.value){
      throw createHttpError(400,"Please provide a name or value");
    }

    const option = await Setting.findOne({
      where: {
        id:settingId,
      },
    });
    if (!option) {
      throw createHttpError(404, "Option not found");
    }
  
     await Setting.update({
      value: body.value,
      name:body.name
    },{
        where: {
            id:settingId,
          },
    });
 
    const updatedData = await Setting.findOne({
      where: {
        id: settingId,
      },
    });

    return res.status(200).json({
      data: updatedData,
      message: "Updated option successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOption = async (req, res, next) => {
  try {
    const option = await Setting.findAll();
    return res.status(200).json({
      data: option,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};
exports.showOption = async (req, res, next) => {
  try {
    const id = req.params.id;
    const option = await Setting.findOne({
      where: {
        id: id,
      },
    });
    if (!option) {
      throw createHttpError(404, "Option not found");
    }
    return res.status(200).json({
      data: option,
      message: "get data successfully",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.addOption = async (req, res, next) => {
  try {
  const body = req.body;
  if(!body.name || !body.value){
    throw createHttpError(400,"Please provide a name and value");
  }
  const newOption = await Setting.create({
    name:body.name,
    value:body.value
  });
  return res.status(200).json({
    data:newOption,
    success: true,
    messag:"save data successfully"
  });
} catch (err) {
    next(err);
  }
};
exports.deleteOption = async (req, res, next) => {
  try {
 const id = req.params.id;
 await Setting.destroy({
    where: {id:id},
 })
 return res.status(200).json({
    data:[],
    success: true,
    messag:"delete data successfully"
  });
} catch (err) {
    next(err);
  }
};
