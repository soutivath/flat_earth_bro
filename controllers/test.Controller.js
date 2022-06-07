import { sequelize } from "../models";
import createHttpError from "http-errors";
import { setFloderName } from "../constants/floderName";

import { differenceInDays } from 'date-fns'
import { format } from 'date-fns'

const fs = require("fs");
const path = require("path");
const { dirname } = require("path");
import { promises } from "fs";

exports.testMulter = async (req, res, next) => {
  return res.status(200).json({
      data:req.user
  });
//   var given = moment("2022-05-11", "YYYY-MM-DD");
//   var current = moment().startOf("day");

//   //Difference in number of days
// let nice=  moment.duration(given.diff(current)).asDays();
//   return res.status(200).json({
//     data: current,
//   });
};
