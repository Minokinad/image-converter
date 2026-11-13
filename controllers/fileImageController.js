const AppError = require('../services/errors');
const { validateImageInput, parseId } = require('../services/validation');

function idFrom(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
  return id;
}

function createImageController(store) {
  return {
    list: async (req, res) => {
      let rows = await store.read();
      for (const key of ['targetFormat', 'status']) {
        if (req.query[key] !== undefined) {
          if (typeof req.query[key] !== 'string') throw new AppError(400, 'INVALID_QUERY', 'Параметр фильтра должен быть строкой.');
          rows = rows.filter(row => row[key] === req.query[key].trim().toLowerCase());
        }
      }
      res.json(rows);
    },
    item: async (req, res) => {
      const id = idFrom(req);
      const row = (await store.read()).find(image => image.id === id);
      if (!row) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
      res.json(row);
    },
    create: async (req, res) => {
      const result = validateImageInput(req.body);
      if (result.errors.length) return res.status(400).json({ error: 'Ошибка валидации', details: result.errors });
      res.status(201).json(await store.create(result.data));
    },
    update: async (req, res) => {
      const id = idFrom(req);
      const result = validateImageInput(req.body);
      if (result.errors.length) return res.status(400).json({ error: 'Ошибка валидации', details: result.errors });
      res.json(await store.update(id, result.data));
    },
    remove: async (req, res) => {
      const id = idFrom(req);
      await store.remove(id);
      res.json({ message: `Задание ${id} удалено.` });
    }
  };
}

module.exports = createImageController;
