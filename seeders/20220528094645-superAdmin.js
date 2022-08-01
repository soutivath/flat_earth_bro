'use strict';
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

     let superadmin = await queryInterface.bulkInsert('users',[{
      name:"ຄຳໃສ",
      surname:"ສົມພົງ",
      dob:"2000-12-20",
      phoneNumber:"+8562011111111",
      image:"default_profile.png",
      is_admin:"superadmin",
      personal_card_no:"1111111111",
      gender:"ທ້າວ",
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkInsert('accounts',[{
    phoneNumber:"+8562011111111",
    password:hashPassword("password"),
    personal_option:false,
    global_option:false,
    notification_topic:"superadmin_notification",
    uid:"XeFoDGaLdBd9bUIqTeotQRDOtz62",
    display_name:"super admin display name",
    user_id:superadmin,
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
  }
};
