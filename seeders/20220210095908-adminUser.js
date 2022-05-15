'use strict';

import {faker} from '@faker-js/faker';
import {hashPassword} from '../libs/utils/bcrypt.js';
const users = [...Array(10)].map((user)=>({
         name: faker.name.firstName(),
         phoneNumber:faker.phone.phoneNumber(), 
         password:hashPassword("password"),
         image: faker.image.avatar(),
         notification_topic:"admin_noficiation_topic",
         firebase_uid:"thisisfirebaseuid",
         is_admin:3,
         createdAt: new Date(),
         updatedAt: new Date()
}));

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
     await queryInterface.bulkInsert('users', users, {});

    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('users', null, {});
  }
};
