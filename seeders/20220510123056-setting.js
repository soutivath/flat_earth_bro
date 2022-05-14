'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
     await queryInterface.bulkInsert('Settings', [{
      name:"trash_price",
      value:5000,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
     await queryInterface.bulkInsert('Settings', [{
      name:"fine",
      value:1000,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

   
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
