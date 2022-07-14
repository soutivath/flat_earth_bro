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
      this.belongsToMany(models.User,{foreignKey: 'renting_id',through: "userrentings",as:"users"});

      this.hasMany(models.RentingDetail,{foreignKey: 'renting_id'});
      this.belongsTo(models.Room,{foreignKey: 'room_id'});
      
      this.hasMany(models.Bill,{foreignKey: 'renting_id'});

      this.hasMany(models.Payment,{foreignKey:"renting_id"});

      this.belongsTo(models.User,{foreignKey:"user_id"});
      this.belongsTo(models.User,{foreignKey:"staff_id",as:"staff"});

      this.hasMany(models.UserRenting,{foreignKey:"user_id"});
    //  this.hasMany(models.Trash,{foreignKey:"renting_id"});
    //  this.hasMany(models.UserRenting,{foreignKey:"renting_id",as:"nice"});
    }
  }
  Renting.init({
    room_id: DataTypes.INTEGER,
    start_renting_date: DataTypes.DATEONLY,
    end_renting_date: DataTypes.DATEONLY,
    is_active:DataTypes.BOOLEAN,
    deposit:DataTypes.INTEGER,
    contract_path:DataTypes.STRING,
    user_id:DataTypes.INTEGER,
    staff_id:DataTypes.INTEGER,
  
  }, {
    sequelize,
    modelName: 'Renting',
    tableName:'rentings'
  });
  return Renting;
};