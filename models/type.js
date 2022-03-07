'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Room,{foreignKey: 'type_id'});
    }
  }
  Type.init({
    name:DataTypes.STRING,
    price:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Type',
  });
  return Type;
};