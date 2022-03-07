'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Renting,{foreignKey:"room_id"});
      this.belongsTo(models.Type,{foreignKey:"type_id"});
    }
  }
  Room.init({
    name:DataTypes.STRING,
    type_id:DataTypes.INTEGER,
    images_path:DataTypes.STRING,
    is_active:DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Room',
  });
  return Room;
};