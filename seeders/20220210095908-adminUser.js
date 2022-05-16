'use strict';

import {faker} from '@faker-js/faker';
import {hashPassword} from '../libs/utils/bcrypt.js';


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
     * 
    */
   const users = [...Array(3)].map((user)=>({
      name: faker.name.firstName(),
      phoneNumber:faker.phone.phoneNumber(), 
      password:hashPassword("password"),
      image: "default_profile.png",
      notification_topic:"admin_noficiation_topic",
      firebase_uid:"thisisfirebaseuid",
      is_admin:1,
      createdAt: new Date(),
      updatedAt: new Date()
}));
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
