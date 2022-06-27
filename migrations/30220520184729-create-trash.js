'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trashes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      is_trash_pay:{
        type:Sequelize.ENUM('paid','unpaid','custom_paid','pass'),
        allowNull: false,
      },
      trash_pay_amount:{
        type:Sequelize.INTEGER,
        allowNull: true,
      },
      renting_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"rentings",
          key:"id",
          onDelete:"CASCADE"
        }
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
      proof_of_payment:{
        allowNull: true,
        type:Sequelize.STRING,
      },
      start_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
      },
      trash_end_date: {
        type:Sequelize.DATEONLY,
        allowNull: false,
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
    await queryInterface.dropTable('trashes');
  }
};