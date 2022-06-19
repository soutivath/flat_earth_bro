'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {foreignKey: 'pay_by',as:"payBy"});
      this.belongsTo(models.User, {foreignKey: 'operate_by',as:"operateBy"});
      this.hasMany(models.PaymentDetail,{foreignKey: 'payment_id'});
      this.belongsTo(models.Renting,{foreignKey: 'renting_id'});
    }
  }
  Payment.init({
    payment_no: DataTypes.STRING,
    pay_by: DataTypes.INTEGER,
    proof_of_payment: DataTypes.STRING,
    total: DataTypes.INTEGER,
    renting_id: DataTypes.INTEGER,
    operate_by:DataTypes.INTEGER,
    pay_date:DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Payment',
    tableName:'payments'
  });
  return Payment;
};