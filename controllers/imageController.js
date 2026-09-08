let images = require("../models/imageModel");

exports.getAllImages = (req, res, next) => {
  try {
    let result = [...images];
    const { status, targetFormat } = req.query;

    if (status) {
      result = result.filter(
        (img) => img.status.toLowerCase() === status.toLowerCase(),
      );
    }
    if (targetFormat) {
      result = result.filter(
        (img) => img.targetFormat.toLowerCase() === targetFormat.toLowerCase(),
      );
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getImageById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const image = images.find((img) => img.id === id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${req.params.id} не найдено`,
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

exports.createImage = (req, res, next) => {
  try {
    const { filename, originalFormat, targetFormat, width, height, filter } =
      req.body;

    if (!filename || !originalFormat || !targetFormat) {
      return res.status(400).json({
        success: false,
        error:
          "Поля filename, originalFormat и targetFormat обязательны для заполнения",
      });
    }

    const newId =
      images.length > 0 ? Math.max(...images.map((img) => img.id)) + 1 : 1;

    const newImage = {
      id: newId,
      filename,
      originalFormat,
      targetFormat,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      filter: filter || "none",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    images.push(newImage);

    res.status(201).json({
      success: true,
      message: "Задача на конвертацию успешно добавлена",
      data: newImage,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateImage = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const index = images.findIndex((img) => img.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${id} не найдено`,
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
    } = req.body;

    if (!filename || !originalFormat || !targetFormat || !status) {
      return res.status(400).json({
        success: false,
        error:
          "Для PUT-запроса требуются все ключевые поля (filename, originalFormat, targetFormat, status)",
      });
    }

    images[index] = {
      ...images[index],
      filename,
      originalFormat,
      targetFormat,
      width: width ? Number(width) : images[index].width,
      height: height ? Number(height) : images[index].height,
      filter: filter || images[index].filter,
      status,
    };

    res.status(200).json({
      success: true,
      message: "Данные изображения успешно обновлены",
      data: images[index],
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const index = images.findIndex((img) => img.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Изображение с ID ${id} не найдено`,
      });
    }

    const deletedImage = images.splice(index, 1)[0];

    res.status(200).json({
      success: true,
      message: `Изображение с ID ${id} успешно удалено`,
      data: deletedImage,
    });
  } catch (error) {
    next(error);
  }
};
