'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RentingDetails', {
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
        type:Sequelize.DATE,
        allowNull: false,
      },
      is_trash_pay:{
        type:Sequelize.BOOLEAN,
        allowNull: false,
      },
      is_renting_pay:{
        type:Sequelize.BOOLEAN,
        allowNull: false,
      },
      trash_pay_amount:{
        type:Sequelize.INTEGER,
        allowNull: true,
      },
      renting_pay_amount:{
        type:Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.dropTable('RentingDetails');
  }
};