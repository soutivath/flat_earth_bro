'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserRenting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // this.belongsTo(models.User,{foreignKey:"user_id",onDelete:"CASCADE"});
      // this.belongsTo(models.Renting,{foreignKey:"renting_id",onDelete:"CASCADE"})
    }
  }
  UserRenting.init({
    user_id:DataTypes.INTEGER,
    renting_id:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'UserRenting',
    tableName:'userrentings'
  });
  return UserRenting;
};