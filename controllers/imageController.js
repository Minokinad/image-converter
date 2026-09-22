const { Image } = require("../models");

exports.getAllImages = async (req, res, next) => {
  try {
    const { status, targetFormat } = req.query;
    const whereConditions = {};

    if (status) {
      whereConditions.status = status;
    }
    if (targetFormat) {
      whereConditions.targetFormat = targetFormat;
    }

    const images = await Image.findAll({
      where: whereConditions,
      order: [["id", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

exports.getImageById = async (req, res, next) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${req.params.id} не найдено в базе данных`,
      });
    }

    res.status(200).json({
      success: true,
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

exports.createImage = async (req, res, next) => {
  try {
    const {
      filename,
      originalFormat,
      targetFormat,
      width,
      height,
      filter,
      fileSize,
    } = req.body;

    if (!filename || !originalFormat || !targetFormat) {
      return res.status(400).json({
        success: false,
        error:
          "Поля filename, originalFormat и targetFormat обязательны для заполнения",
      });
    }

    const newImage = await Image.create({
      filename,
      originalFormat,
      targetFormat,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      filter: filter || "none",
      fileSize: fileSize ? Number(fileSize) : 0,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Задача на конвертацию успешно сохранена в БД",
      data: newImage,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateImage = async (req, res, next) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${req.params.id} не найдено`,
      });
    }

    const {
      filename,
      originalFormat,
      targetFormat,
      width,
      height,
      filter,
      status,
      fileSize,
    } = req.body;

    if (!filename || !originalFormat || !targetFormat || !status) {
      return res.status(400).json({
        success: false,
        error:
          "Для PUT-запроса требуются все ключевые поля (filename, originalFormat, targetFormat, status)",
      });
    }

    await image.update({
      filename,
      originalFormat,
      targetFormat,
      width: width !== undefined ? Number(width) : image.width,
      height: height !== undefined ? Number(height) : image.height,
      filter: filter || image.filter,
      status,
      fileSize: fileSize !== undefined ? Number(fileSize) : image.fileSize,
    });

    res.status(200).json({
      success: true,
      message: "Запись в базе данных успешно обновлена",
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${req.params.id} не найдено`,
      });
    }

    await image.destroy();

    res.status(200).json({
      success: true,
      message: `Изображение с ID ${req.params.id} успешно удалено из БД`,
      data: image,
    });
  } catch (error) {
    next(error);
  }
};
