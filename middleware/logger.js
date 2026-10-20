const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(logDirectory, 'app.log');

try {
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
} catch (err) {
  console.error('Ошибка создания папки logs при инициализации:', err.message);
}

const logger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${req.method} ${req.originalUrl || req.url} | Status: ${res.statusCode} | Duration: ${duration}ms\n`;

    try {
      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
      }
      fs.appendFile(logFilePath, logLine, 'utf8', (err) => {
        if (err) {
          console.error('Ошибка записи в logs/app.log:', err.message);
        }
      });
    } catch (err) {
      console.error('Критический сбой записи лога:', err.message);
    }
  });

  next();
};

module.exports = logger;