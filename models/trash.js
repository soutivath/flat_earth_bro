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
     // this.belongsTo(models.User,{foreignKey: 'trash_pay_by',as:"trash_pay"});
      this.belongsTo(models.RentingDetail,{foreignKey: 'rentingdetail_id',as:"rentingdetail"});

     // this.hasMany(models.Account,{foreignKey:'user_id'});

     this.belongsTo(models.User,{foreignKey:"pay_by",as:"trash_pay_by",onDelete:"SET NULL"});
     this.belongsTo(models.User,{foreignKey:"operate_by",as:"trash_operate_by",onDelete:"SET NULL"});
     
    }
  }
  Trash.init({
    is_trash_pay:DataTypes.ENUM("paid","unpaid","pass"),
    trash_pay_amount:DataTypes.INTEGER,
    rentingdetail_id: DataTypes.INTEGER,
    proof_of_payment:DataTypes.STRING,
    pay_by:DataTypes.INTEGER,
    operate_by:DataTypes.INTEGER,
  
  }, {
    sequelize,
    modelName: 'Trash',
    tableName:'trashes'
  });
  return Trash;
};