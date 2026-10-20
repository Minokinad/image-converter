const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const logger = require('./middleware/logger');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Загрузка правил валидации
const validationRules = require('./config/validationRules.json');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDir, 'images.json');

const initialMockImages = [
  {
    id: 1,
    filename: "autumn_photo_2026.png",
    originalFormat: "png",
    targetFormat: "webp",
    width: 1920,
    height: 1080,
    filter: "vintage",
    status: "completed",
    createdAt: "2026-09-06T10:15:30.000Z",
    updatedAt: "2026-09-06T10:15:30.000Z"
  },
  {
    id: 2,
    filename: "banner_mockup.jpg",
    originalFormat: "jpg",
    targetFormat: "png",
    width: 1200,
    height: 630,
    filter: "none",
    status: "pending",
    createdAt: "2026-09-07T12:00:00.000Z",
    updatedAt: "2026-09-07T12:00:00.000Z"
  },
  {
    id: 3,
    filename: "avatar_portrait.png",
    originalFormat: "png",
    targetFormat: "webp",
    width: 512,
    height: 512,
    filter: "grayscale",
    status: "processing",
    createdAt: "2026-09-08T08:30:15.000Z",
    updatedAt: "2026-09-08T08:30:15.000Z"
  }
];

function readImagesFromFile() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(initialMockImages, null, 2), 'utf8');
      return initialMockImages;
    }
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Ошибка чтения data/images.json:', err.message);
    return [];
  }
}

function writeImagesToFile(images) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(images, null, 2), 'utf8');
  } catch (err) {
    console.error('Ошибка записи data/images.json:', err.message);
  }
}

function validateImageInput(data) {
  const errors = [];
  const rules = validationRules;

  const rawFilename = typeof data.filename === 'string' ? data.filename.trim() : '';
  if (!rawFilename) {
    errors.push('Поле "filename" не может быть пустым или состоять только из пробелов.');
  } else if (
    rawFilename.length < rules.filename.minLength || 
    rawFilename.length > rules.filename.maxLength
  ) {
    errors.push(`Длина имени файла должна быть от ${rules.filename.minLength} до ${rules.filename.maxLength} символов.`);
  }

  const rawOriginalFormat = typeof data.originalFormat === 'string' ? data.originalFormat.trim().toLowerCase() : '';
  if (!rawOriginalFormat) {
    errors.push('Поле "originalFormat" обязательно для заполнения.');
  } else if (!rules.allowedOriginalFormats.includes(rawOriginalFormat)) {
    errors.push(`Формат "${rawOriginalFormat}" недопустим. Разрешены: ${rules.allowedOriginalFormats.join(', ')}.`);
  }

  const rawTargetFormat = typeof data.targetFormat === 'string' ? data.targetFormat.trim().toLowerCase() : '';
  if (!rawTargetFormat) {
    errors.push('Поле "targetFormat" обязательно для заполнения.');
  } else if (!rules.allowedTargetFormats.includes(rawTargetFormat)) {
    errors.push(`Целевой формат "${rawTargetFormat}" недопустим. Разрешены: ${rules.allowedTargetFormats.join(', ')}.`);
  }

  const numWidth = Number(data.width);
  if (data.width === undefined || data.width === null || data.width === '' || isNaN(numWidth)) {
    errors.push('Поле "width" должно быть числом.');
  } else if (numWidth < rules.dimensions.minWidth || numWidth > rules.dimensions.maxWidth) {
    errors.push(`Значение "width" должно быть в диапазоне от ${rules.dimensions.minWidth} до ${rules.dimensions.maxWidth}.`);
  }

  const numHeight = Number(data.height);
  if (data.height === undefined || data.height === null || data.height === '' || isNaN(numHeight)) {
    errors.push('Поле "height" должно быть числом.');
  } else if (numHeight < rules.dimensions.minHeight || numHeight > rules.dimensions.maxHeight) {
    errors.push(`Значение "height" должно быть в диапазоне от ${rules.dimensions.minHeight} до ${rules.dimensions.maxHeight}.`);
  }

  const rawFilter = typeof data.filter === 'string' ? data.filter.trim().toLowerCase() : 'none';
  if (rawFilter && !rules.allowedFilters.includes(rawFilter)) {
    errors.push(`Фильтр "${rawFilter}" недопустим. Разрешены: ${rules.allowedFilters.join(', ')}.`);
  }

  const rawStatus = typeof data.status === 'string' ? data.status.trim().toLowerCase() : 'pending';
  if (rawStatus && !rules.allowedStatuses.includes(rawStatus)) {
    errors.push(`Статус "${rawStatus}" недопустим. Разрешены: ${rules.allowedStatuses.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitized: {
      filename: rawFilename,
      originalFormat: rawOriginalFormat,
      targetFormat: rawTargetFormat,
      width: numWidth,
      height: numHeight,
      filter: rawFilter || 'none',
      status: rawStatus || 'pending'
    }
  };
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(logger);
app.use(authMiddleware);

app.get('/', (req, res) => {
  const images = readImagesFromFile();
  res.render('index', {
    images: images
  });
});

app.get('/add', (req, res) => {
  res.render('add', {
    errors: [],
    formData: {},
    rules: validationRules
  });
});

app.post('/add', (req, res) => {
  if (!req.user || !req.user.isAuth) {
    return res.status(403).render('add', {
      errors: ['Действие запрещено: добавлять задачи могут только авторизованные пользователи (?auth=1).'],
      formData: req.body,
      rules: validationRules
    });
  }

  const validation = validateImageInput(req.body);

  if (!validation.isValid) {
    return res.status(400).render('add', {
      errors: validation.errors,
      formData: req.body,
      rules: validationRules
    });
  }

  const images = readImagesFromFile();
  const nextId = images.length > 0 ? Math.max(...images.map(img => Number(img.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newImage = {
    id: nextId,
    filename: validation.sanitized.filename,
    originalFormat: validation.sanitized.originalFormat,
    targetFormat: validation.sanitized.targetFormat,
    width: validation.sanitized.width,
    height: validation.sanitized.height,
    filter: validation.sanitized.filter,
    status: validation.sanitized.status,
    createdAt: now,
    updatedAt: now
  };

  images.push(newImage);
  writeImagesToFile(images);

  const authQuery = req.user.isAuth ? '?auth=1' : '';
  res.redirect(`/${authQuery}`);
});

app.get('/images/:id', (req, res) => {
  const imageId = Number(req.params.id);
  const images = readImagesFromFile();
  const image = images.find(img => img.id === imageId);

  if (!image) {
    return res.status(404).render('404', {
      title: '404 - Задача не найдена',
      url: req.originalUrl
    });
  }

  res.render('item', {
    image: image
  });
});

app.get('/trigger-500', (req, res, next) => {
  next(new Error('Тестовая ошибка сервера 500'));
});

app.get('/api/images', (req, res) => {
  let images = readImagesFromFile();
  if (req.query.targetFormat) {
    images = images.filter(img => img.targetFormat.toLowerCase() === req.query.targetFormat.toLowerCase());
  }
  res.status(200).json(images);
});

app.get('/api/images/:id', (req, res) => {
  const images = readImagesFromFile();
  const image = images.find(img => img.id === Number(req.params.id));
  if (!image) {
    return res.status(404).json({ error: 'Изображение не найдено' });
  }
  res.status(200).json(image);
});

app.post('/api/images', (req, res) => {
  const validation = validateImageInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors
    });
  }

  const images = readImagesFromFile();
  const nextId = images.length > 0 ? Math.max(...images.map(img => Number(img.id) || 0)) + 1 : 1;
  const now = req.body.createdAt || new Date().toISOString();

  const newRecord = {
    id: nextId,
    filename: validation.sanitized.filename,
    originalFormat: validation.sanitized.originalFormat,
    targetFormat: validation.sanitized.targetFormat,
    width: validation.sanitized.width,
    height: validation.sanitized.height,
    filter: validation.sanitized.filter,
    status: validation.sanitized.status,
    createdAt: now,
    updatedAt: now
  };

  images.push(newRecord);
  writeImagesToFile(images);
  res.status(201).json(newRecord);
});

app.put('/api/images/:id', (req, res) => {
  const images = readImagesFromFile();
  const index = images.findIndex(img => img.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Изображение не найдено для обновления' });
  }

  const validation = validateImageInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors
    });
  }

  const updatedRecord = {
    ...images[index],
    filename: validation.sanitized.filename,
    originalFormat: validation.sanitized.originalFormat,
    targetFormat: validation.sanitized.targetFormat,
    width: validation.sanitized.width,
    height: validation.sanitized.height,
    filter: validation.sanitized.filter,
    status: validation.sanitized.status,
    updatedAt: req.body.updatedAt || new Date().toISOString()
  };

  images[index] = updatedRecord;
  writeImagesToFile(images);
  res.status(200).json(updatedRecord);
});

app.delete('/api/images/:id', (req, res) => {
  const images = readImagesFromFile();
  const targetId = Number(req.params.id);
  const exists = images.some(img => img.id === targetId);

  if (!exists) {
    return res.status(404).json({ error: 'Изображение не найдено' });
  }

  const filtered = images.filter(img => img.id !== targetId);
  writeImagesToFile(filtered);
  res.status(200).json({ message: `Изображение с ID ${targetId} успешно удалено` });
});

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API эндпоинт не найден' });
  }
  res.status(404).render('404', {
    title: '404 - Страница не найдена',
    url: req.originalUrl
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Сервер запущен на http://localhost:${PORT}`);
  console.log(` Главная страница: http://localhost:${PORT}`);
  console.log(` Режим админа:     http://localhost:${PORT}?auth=1`);
  console.log(` Тест ошибки 500:  http://localhost:${PORT}/trigger-500`);
  console.log(`===================================================`);
});