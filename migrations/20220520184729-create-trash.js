'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Trashes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      is_trash_pay:{
        type:Sequelize.ENUM('paid','unpaid','pass'),
        allowNull: false,
      },
      trash_pay_by:{
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model:"users",
          onDelete:"SET NULL",
          key:"id"
        }
      },
      trash_pay_amount:{
        type:Sequelize.INTEGER,
        allowNull: true,
      },
      rentingdetails_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"rentingdetails",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      proof_of_payment:{
        allowNull: true,
        type:Sequelize.STRING,
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
    await queryInterface.dropTable('Trashes');
  }
};