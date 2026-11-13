const AppError = require('../services/errors');
const { rules, validateImageInput, parseId } = require('../services/validation');

function createPagesController(store, logger) {
  return {
    index: async (req, res) => res.render('index', { images: (await store.read()).sort((a, b) => b.id - a.id) }),
    item: async (req, res) => {
      const id = parseId(req.params.id);
      if (id === null) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
      const image = (await store.read()).find(row => row.id === id);
      if (!image) throw new AppError(404, 'NOT_FOUND', 'Задание не найдено.');
      res.render('item', { image });
    },
    add: (req, res) => res.render('add', { errors: [], formData: {}, rules }),
    create: async (req, res) => {
      const result = validateImageInput(req.body);
      if (result.errors.length) {
        return res.status(400).render('add', { errors: result.errors, formData: result.values, rules });
      }
      await store.create(result.data);
      res.redirect(303, '/?auth=1');
    },
    logs: async (req, res) => res.render('logs', { content: await logger.read() })
  };
}

module.exports = createPagesController;
