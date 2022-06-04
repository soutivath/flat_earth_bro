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
        type:Sequelize.ENUM('paid','unpaid','custom_paid'),
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