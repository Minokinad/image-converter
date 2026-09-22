"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    static associate(models) {}
  }

  Image.init(
    {
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalFormat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      targetFormat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      width: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      filter: {
        type: DataTypes.STRING,
        defaultValue: "none",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Image",
      tableName: "Images",
    },
  );

  return Image;
};
