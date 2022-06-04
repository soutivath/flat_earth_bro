'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      global_option: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      personal_option: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      notification_topic:{
        type:Sequelize.STRING,
        allowNull: true
      },
      uid:{
        type: Sequelize.STRING,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references:{
          model:"users",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      display_name:Sequelize.STRING,
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
    await queryInterface.dropTable('accounts');
  }
};