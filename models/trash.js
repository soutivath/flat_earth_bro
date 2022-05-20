'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Trash extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User,{foreignKey: 'trash_pay_by',as:"trash_pay"});
      this.belongsTo(models.RentingDetails,{foreignKey: 'rentingdetails_id',as:"rentingdetails"});

    }
  }
  Trash.init({
    is_trash_pay:DataTypes.ENUM("paid","unpaid","pass"),
    trash_pay_by:DataTypes.INTEGER,
    trash_pay_amount:DataTypes.INTEGER,
    rentingdetails_id: DataTypes.INTEGER,
    proof_of_payment:DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Trash',
  });
  return Trash;
};