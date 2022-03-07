'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Renting,{foreignKey: 'renting_id'});
    }
  }
  Bill.init({
  
    image_path:DataTypes.STRING,
    price:DataTypes.INTEGER,
    bill_type:DataTypes.ENUM("fire","water"),
    is_pay:DataTypes.BOOLEAN,
    renting_id:DataTypes.INTEGER,
    is_user_read:DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Bill',
  });
  return Bill;
};