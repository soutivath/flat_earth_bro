'use strict';
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
      this.belongsToMany(models.Renting, {foreignKey: 'user_id',through:'userrentings',as:'rentings',onDelete:"CASCADE"});

      this.hasMany(models.Notification, {foreignKey: 'user_id',as:"notification"});

      this.hasMany(models.RentingDetail,{foreignKey:"trash_pay_by",as:"trash_pay",onDelete:"SET NULL"});
      this.hasMany(models.RentingDetail,{foreignKey:"renting_pay_by",as:"renting_pay",onDelete:"SET NULL"});

     this.hasMany(models.Bill,{foreignKey:"pay_by",as:"pay_by",onDelete:"SET NULL"});
    }
  }
  User.init({
    name: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    password: DataTypes.STRING,
    image:DataTypes.STRING,
    is_admin: DataTypes.BOOLEAN,
    notification_topic:DataTypes.STRING,
    firebase_uid:DataTypes.STRING,
    display_name:DataTypes.STRING
  
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
  return User;
};