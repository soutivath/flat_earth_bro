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
     
    //  this.belongsTo(models.User,{foreignKey: 'renting_pay_by',as:"renting_pay"});

      this.hasOne(models.Trash,{foreignKey:'rentingdetail_id'});

     this.belongsTo(models.User,{foreignKey:"pay_by",as:"renting_pay_by",onDelete:"SET NULL"});
     this.belongsTo(models.User,{foreignKey:"operate_by",as:"renting_operate_by",onDelete:"SET NULL"});

    

    }
  }

  
  RentingDetail.init({
    renting_id:DataTypes.INTEGER,
    start_date:DataTypes.DATEONLY,
    end_date:DataTypes.DATEONLY,
   
    is_renting_pay:DataTypes.ENUM("paid","unpaid","pass"),
  
    renting_pay_amount:DataTypes.INTEGER,
  
  
    fine:DataTypes.INTEGER,
    proof_of_payment:DataTypes.STRING,

  }, {
    sequelize,
    modelName: 'RentingDetail',
    tableName:'rentingdetails'
  });
  return RentingDetail;
};