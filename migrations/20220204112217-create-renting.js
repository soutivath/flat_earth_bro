'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rentings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      room_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"rooms",
          key:"id",
          onDelete:"CASCADE"
        }
      },
      start_renting_date:{
        allowNull: false,
        type:Sequelize.DATE
      },
      end_renting_date:{
        allowNull: true,
        type:Sequelize.DATE
      },
      is_active:{
        allowNull: false,
        type:Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Rentings');
  }
};