'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {foreignKey: 'user_id',as:"notification"});
    }
  }
  Notification.init({
    user_id: DataTypes.INTEGER,
    global_option: DataTypes.BOOLEAN,
    personal_option: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notification',
    tableName:'notifications'
  });
  return Notification;
};