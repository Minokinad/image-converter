const errorHandler = (err, req, res, next) => {
  console.error('--- СЕРВЕРНАЯ ОШИБКА ---');
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(status);

  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.json({
      error: true,
      message: message,
      status: status
    });
  }

  res.render('500', {
    title: 'Ошибка 500 | Сбой сервера',
    status: status,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = errorHandler;