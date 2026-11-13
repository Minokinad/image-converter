const express = require('express');
const createPagesController = require('../controllers/pagesController');

function pagesRoutes(store, logger, requireAdmin) {
  const router = express.Router();
  const pages = createPagesController(store, logger);
  router.get('/', pages.index);
  router.get('/add', pages.add);
  router.post('/add', requireAdmin, pages.create);
  router.get('/images/:id', pages.item);
  router.get('/admin/logs', requireAdmin, pages.logs);
  return router;
}

module.exports = pagesRoutes;
