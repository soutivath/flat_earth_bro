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
      start_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
      },
      is_renting_pay:{
        type:Sequelize.ENUM('paid','unpaid','custom_paid','pass'),
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
      pay_by:{
        type:Sequelize.INTEGER,
        allowNull:true,
        references:{
          model:'users',
          key:'id',
          onDelete:"CASCADE"
        }
      },
      operate_by:{
        type:Sequelize.INTEGER,
        allowNull:true,
        references:{
          model:'users',
          key:'id',
          onDelete:"CASCADE"
        }
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