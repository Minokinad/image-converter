"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Images", "fileSize", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Размер файла в килобайтах",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Images", "fileSize");
  },
};
