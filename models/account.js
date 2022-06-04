'use strict';
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
  }, {
    sequelize,
    modelName: 'Account',
    tableName:'accounts'
  });
  return Account;
};