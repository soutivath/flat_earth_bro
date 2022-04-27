'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RentingDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Renting,{foreignKey: 'renting_id'});
      this.belongsTo(models.User,{foreignKey: 'trash_pay_by',as:"trash_pay"});
      this.belongsTo(models.User,{foreignKey: 'renting_pay_by',as:"renting_pay"})
    }
  }
  RentingDetail.init({
    renting_id:DataTypes.INTEGER,
    end_date:DataTypes.DATE,
    is_trash_pay:DataTypes.BOOLEAN,
    is_renting_pay:DataTypes.BOOLEAN,
    trash_pay_amount:DataTypes.INTEGER,
    renting_pay_amount:DataTypes.INTEGER,
    trash_pay_by:DataTypes.INTEGER,
    renting_pay_by:DataTypes.INTEGER,


  }, {
    sequelize,
    modelName: 'RentingDetail',
  });
  return RentingDetail;
};