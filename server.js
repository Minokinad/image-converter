require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const createImageStore = require('./services/imageStore');
const createLogger = require('./middleware/logger');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const pagesRoutes = require('./routes/pages');
const imageRoutes = require('./routes/fileImages');
const AppError = require('./services/errors');

function createApp(options = {}) {
  const app = express();
  const store = createImageStore(options.dataFile || process.env.DATA_FILE || path.join(__dirname, 'data/images.json'));
  const logger = createLogger(options.logFile || path.join(__dirname, 'logs/app.log'), options.logConsole !== false);
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.locals.formatDate = value => new Date(value).toLocaleString('ru-RU');
  app.locals.flushLogs = logger.flush;
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-Id', req.requestId);
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(auth);
  app.use(logger.middleware);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json({ limit: '16kb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 20 }));
  const requireAdmin = (req, res, next) => {
    if (!req.user.isAuth) return next(new AppError(403, 'FORBIDDEN', 'Это действие доступно только администратору.'));
    next();
  };
  app.use('/api/images', imageRoutes(store, requireAdmin));
  app.use('/', pagesRoutes(store, logger, requireAdmin));
  app.use((req, res) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ресурс не найден.' });
    res.status(404).render('404', { url: req.originalUrl });
  });
  app.use((err, req, res, next) => {
    if (err.status === 404 && !req.path.startsWith('/api/')) {
      return res.status(404).render('404', { url: req.originalUrl });
    }
    next(err);
  });
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const app = createApp();
  const server = app.listen(port, () => console.log(`Сервер: http://localhost:${port}`));
  server.on('error', err => { console.error('Не удалось запустить сервер:', err.message); process.exitCode = 1; });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(async () => { await app.locals.flushLogs(); });
    server.closeIdleConnections();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { createApp };
