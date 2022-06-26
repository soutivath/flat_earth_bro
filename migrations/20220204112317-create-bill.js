'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      image_path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price:{
        type:Sequelize.INTEGER,
        allowNull: false,
      },
      bill_type: {
        type:Sequelize.ENUM("electric","water"),
        allowNull: false,
      },
      is_pay:{
        type:Sequelize.ENUM('paid','unpaid','custom_paid','pass'),
      },
      renting_id:{
        type:Sequelize.INTEGER,
        references:{
          model:"rentings",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      proof_of_payment:{
        allowNull: true,
        type:Sequelize.STRING,
      },
      pay_by:{
        type:Sequelize.INTEGER,
        allowNull: true,
        references:{
          model:"users",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      operate_by:{
        allowNull: true,
        type:Sequelize.INTEGER,
        references:{
          model:"users",
          key:"id",
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
    await queryInterface.dropTable('bills');
  }
};