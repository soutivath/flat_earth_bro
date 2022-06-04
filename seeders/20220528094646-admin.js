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
     let admin = await queryInterface.bulkInsert('users',[{
    
      name:"just normal Admin",
      phoneNumber:"+8562022222222",
      image:"default_profile.png",
      is_admin:"admin",
      personal_card_no:"2222222222",
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    await queryInterface.bulkInsert('accounts',[{
    phoneNumber:"+8562022222222",
    password:hashPassword("password"),
    personal_option:false,
    global_option:false,
    notification_topic:"admin_notification",
    uid:"aPYUPs9n7vMKpHSRaNjfYNltBR13",
    display_name:"normal admin display name",
    user_id:admin,
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
     await queryInterface.bulkDelete('users', null, {});
  }
};
