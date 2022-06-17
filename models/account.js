'use strict';
const { dirname } = require("path");
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User,{foreignKey:"user_id"});
    }
  }
  Account.init({
    phoneNumber: DataTypes.STRING,
    password: DataTypes.STRING,
    personal_option:DataTypes.BOOLEAN,
    global_option:DataTypes.BOOLEAN,
    notification_topic:DataTypes.STRING,
    uid:DataTypes.STRING,
    display_name:DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    display_image:DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Account',
    tableName:'accounts'
  });

  Account.prototype.getDisplayImagePath = function(){
    
    const appDir = dirname(require.main.filename);
    let dir = `${appDir}/public/images/resources/display_images/${this.display_image}`;
    return dir
  }

  Account.prototype.getOnlineDisplayImage = function(){
    let image  = `${process.env.APP_DOMAIN}/images/resources/display_images/${
      this.display_image
    }`;

    return image;
  }

  

  return Account;
};