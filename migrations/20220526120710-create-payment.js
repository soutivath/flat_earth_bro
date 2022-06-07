'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      payment_no: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pay_by: {
        type: Sequelize.INTEGER,
        references:{
          model:"users",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      proof_of_payment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total: {
        type: Sequelize.INTEGER
      },
      renting_id: {
        type: Sequelize.INTEGER,
        references:{
          model:"rentings",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      operate_by:{
        type:Sequelize.INTEGER,
        references:{
          model:"users",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      pay_date:{
        type:Sequelize.DATE
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
    await queryInterface.dropTable('payments');
  }
};