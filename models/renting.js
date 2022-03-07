'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Renting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.User,{foreignKey: 'user_id',through: "userrentings",as:"users"});

      this.hasMany(models.RentingDetail,{foreignKey: 'renting_id'});
      this.belongsTo(models.Room,{foreignKey: 'room_id'});
      
      this.hasMany(models.Bill,{foreignKey: 'bill_id'});
    }
  }
  Renting.init({
    room_id: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    active:DataTypes.BOOLEAN,

  }, {
    sequelize,
    modelName: 'Renting',
  });
  return Renting;
};