'use strict';
import {Type} from "../models";
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


      await queryInterface.bulkInsert('types',[{
        name:"ຫ້ອງທຳມະດາ",
        price:"1000000",
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
   
    
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('types', null, {});
  }
};
