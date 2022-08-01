'use strict';
require('dotenv').config();
const { dirname } = require("path");
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.Renting, {foreignKey: 'user_id',through:'userrentings',onDelete:"CASCADE",as:"rentings"});

      this.hasMany(models.Notification, {foreignKey: 'user_id',as:"notification"});

     
    //  this.hasMany(models.RentingDetail,{foreignKey:"renting_pay_by",as:"renting_pay",onDelete:"SET NULL"});

     this.hasMany(models.Bill,{foreignKey:"pay_by",as:"bill_pay_by",onDelete:"SET NULL"});
     this.hasMany(models.Bill,{foreignKey:"operate_by",as:"bill_operate_by",onDelete:"SET NULL"});

     this.hasMany(models.Trash,{foreignKey:"pay_by",as:"trash_pay_by",onDelete:"SET NULL"});
     this.hasMany(models.Trash,{foreignKey:"operate_by",as:"trash_operate_by",onDelete:"SET NULL"});
     this.hasMany(models.RentingDetail,{foreignKey:"pay_by",as:"renting_pay_by",onDelete:"SET NULL"});
     this.hasMany(models.RentingDetail,{foreignKey:"operate_by",as:"renting_operate_by",onDelete:"SET NULL"});

     //this.hasMany(models.RentingDetail,{foreignKey:"trash_pay_by",as:"trash_pay",onDelete:"SET NULL"});
   //  this.hasMany(models.Trash,{foreignKey:"trash_pay_by"});

     this.hasOne(models.Account,{foreignKey:"user_id"});

     this.hasMany(models.Payment, {foreignKey: 'pay_by',as:"payBy"});
     this.hasMany(models.Payment, {foreignKey: 'operate_by',as:"operateBy"});

     this.hasOne(models.Renting,{foreignKey:"user_id"});
     this.hasOne(models.Renting,{foreignKey:"staff_id",as:"staff_renting"});
    }
  }
  User.init({
    name: DataTypes.STRING,
    surname: DataTypes.STRING,
    dob:DataTypes.DATEONLY,
    phoneNumber: DataTypes.STRING,
  
    image:DataTypes.STRING,
    is_admin: DataTypes.ENUM("superadmin","admin","user"),
    personal_card_no:DataTypes.STRING,
    gender:DataTypes.ENUM("ທ້າວ","ນາງ"),
  }, {
    sequelize,
    modelName: 'User',
    tableName:'users'
  });

  User.prototype.getProfilePath = function(){
    
    const appDir = dirname(require.main.filename);
    let dir = `${appDir}/public/images/resources/profile_images/${this.image}`;
    return dir
  }

  User.prototype.getOnlinePath = function(){
   let path  = `${process.env.APP_DOMAIN}/images/resources/profile_images/${this.image}`;
    return path;
  }
  
  return User;
};