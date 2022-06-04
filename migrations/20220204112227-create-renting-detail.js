'use strict';
const { dirname } = require('path');
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rentingdetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      renting_id: {
        type:Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"rentings",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      end_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
      },
      is_renting_pay:{
        type:Sequelize.ENUM('paid','unpaid','custom_paid'),
        allowNull: false,
      },
      renting_pay_amount:{
        type:Sequelize.INTEGER,
        allowNull: true,
      },
      proof_of_payment:{
        type:Sequelize.INTEGER,
      },
      fine:{
        type:Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rentingdetails');
  }
};