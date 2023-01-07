'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Options","questionID",{
      type:Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Options",{
      fields:["questionID"],
      type:"foreign key",
      references:{
        table:"Questions",
        field:"id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Options","questionID");
  }
};
