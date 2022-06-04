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

    for(let i = 0;i<=10;i++) {
      await queryInterface.bulkInsert('rooms', [{
        name:"Room "+i.toString(),
        is_active:0,
        type_id:1,
        images_path:"room"+i,
        electric_motor_number:i.toString().padEnd(10,"0"),
        water_motor_number:i.toString().padStart(10,"0"),
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
     
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('rooms', null, {});
  }
};
