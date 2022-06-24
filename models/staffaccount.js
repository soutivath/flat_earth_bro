'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StaffAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  StaffAccount.init({
    password: DataTypes.STRING,
    display_name:DataTypes.STRING,
    display_image:DataTypes.STRING,
    staff_id:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'StaffAccount',
  });
  return StaffAccount;
};