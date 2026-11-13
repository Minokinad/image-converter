const express = require('express');
const createImageController = require('../controllers/fileImageController');

function imageRoutes(store, requireAdmin) {
  const router = express.Router();
  const images = createImageController(store);
  router.get('/', images.list);
  router.get('/:id', images.item);
  router.post('/', requireAdmin, images.create);
  router.put('/:id', requireAdmin, images.update);
  router.delete('/:id', requireAdmin, images.remove);
  return router;
}

module.exports = imageRoutes;
