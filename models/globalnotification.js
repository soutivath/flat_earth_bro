'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GlobalNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GlobalNotification.init({
    title: DataTypes.STRING,
    message: DataTypes.STRING,
    detail: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'GlobalNotification',
    tableName:'globalnotifications'
  });
  return GlobalNotification;
};