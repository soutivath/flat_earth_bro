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
    */

//      const users = [...Array(3)].map((user)=>({
//       name: faker.name.firstName(),
//       phoneNumber:faker.phone.phoneNumber(), 
//       password:hashPassword("password"),
//       image: "default_profile.png",
//       notification_topic:"user_noficiation_topic",
//       firebase_uid:"thisisfirebaseuid",
//       is_admin:0,
//       createdAt: new Date(),
//       updatedAt: new Date()
// }));
//      await queryInterface.bulkInsert('users', users, {});

//user 1
let user3 = await queryInterface.bulkInsert('users',[{
    
  name:"user 1",
  phoneNumber:"+8562033333333",
  image:"default_profile.png",
  is_admin:"user",
  personal_card_no:"3333333333",
  createdAt: new Date(),
  updatedAt: new Date()
}]);
await queryInterface.bulkInsert('accounts',[{
phoneNumber:"+8562033333333",
password:hashPassword("password"),
personal_option:false,
global_option:false,
notification_topic:"user_notification_3",
uid:"lmoR8Q8xJuRVcKKEjer2aNYxeZK2",
display_name:"normal user 1",
user_id:user3,
createdAt: new Date(),
updatedAt: new Date()
}]);

//user 2
let user4 = await queryInterface.bulkInsert('users',[{
    
  name:"just user 2",
  phoneNumber:"+8562044444444",
  image:"default_profile.png",
  is_admin:"user",
  personal_card_no:"4444444444",
  createdAt: new Date(),
  updatedAt: new Date()
}]);
await queryInterface.bulkInsert('accounts',[{
phoneNumber:"+8562044444444",
password:hashPassword("password"),
personal_option:false,
global_option:false,
notification_topic:"user_notification_4",
uid:"dD7cmQatL2Q5zapjAQe3IUe0qv63",
display_name:"normal user 2 display name",
user_id:user4,
createdAt: new Date(),
updatedAt: new Date()
}]);

//user 3
let user5 = await queryInterface.bulkInsert('users',[{
    
  name:"just normal user 3",
  phoneNumber:"+8562055555555",
  image:"default_profile.png",
  is_admin:"user",
  personal_card_no:"5555555555",
  createdAt: new Date(),
  updatedAt: new Date()
}]);
await queryInterface.bulkInsert('accounts',[{
phoneNumber:"+8562055555555",
password:hashPassword("password"),
personal_option:false,
global_option:false,
notification_topic:"user_notification_5",
uid:"P75QtFjFx4ewD9Q4jnb5bsi8E1k2",
display_name:"normal user display name 3",
user_id:user5,
createdAt: new Date(),
updatedAt: new Date()
}]);

//user 4
let user6 = await queryInterface.bulkInsert('users',[{
    
  name:"just normal user 6",
  phoneNumber:"+8562066666666",
  image:"default_profile.png",
  is_admin:"user",
  personal_card_no:"6666666666",
  createdAt: new Date(),
  updatedAt: new Date()
}]);
await queryInterface.bulkInsert('accounts',[{
phoneNumber:"+8562066666666",
password:hashPassword("password"),
personal_option:false,
global_option:false,
notification_topic:"user_notification_6",
uid:"QgmCkBtAZWRImF7qTFDMuIThkZn2",
display_name:"normal user display name 6",
user_id:user6,
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
