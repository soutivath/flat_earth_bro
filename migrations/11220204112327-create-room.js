'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active:{
        type:Sequelize.BOOLEAN,
        allowNull: false
      },
      images_path:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      type_id:{
        type:Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"types",
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
    await queryInterface.dropTable('Rooms');
  }
};