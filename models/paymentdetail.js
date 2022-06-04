'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PaymentDetail.init({
    name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    type: DataTypes.ENUM("water","electric","trash","renting","fine"),
  }, {
    sequelize,
    modelName: 'PaymentDetail',
    tableName:'paymentdetails'
  });
  return PaymentDetail;
};