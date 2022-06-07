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

     //this.belongsTo(models.User,{foreignKey: 'is_pay'});
    }
  }
  Bill.init({
    image_path:DataTypes.STRING,
    price:DataTypes.INTEGER,
    bill_type:DataTypes.ENUM("electric","water"),
    is_pay:DataTypes.BOOLEAN,
    renting_id:DataTypes.INTEGER,
    proof_of_payment:DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Bill',
    tableName:'bills'
  });

  Bill.prototype.getImagePath = function nice(){
    const appDir = dirname(require.main.filename);
    let dir = `${appDir}/public/images/resources/bills/${image_path}`;
    return dir
  }
  return Bill;
};