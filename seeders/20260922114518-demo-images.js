"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Images",
      [
        {
          filename: "avatar_source.png",
          originalFormat: "png",
          targetFormat: "webp",
          width: 500,
          height: 500,
          filter: "grayscale",
          status: "completed",
          fileSize: 128,
          createdAt: new Date("2026-09-06T08:30:00.000Z"),
          updatedAt: new Date("2026-09-06T08:35:00.000Z"),
        },
        {
          filename: "landscape.jpeg",
          originalFormat: "jpeg",
          targetFormat: "png",
          width: 1920,
          height: 1080,
          filter: "none",
          status: "pending",
          fileSize: 0,
          createdAt: new Date("2026-09-06T09:15:00.000Z"),
          updatedAt: new Date("2026-09-06T09:15:00.000Z"),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Images", null, {});
  },
};
