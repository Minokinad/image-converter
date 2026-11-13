function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  let message = err.publicMessage;
  let code = err.code || 'INTERNAL_ERROR';
  if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Некорректный JSON в теле запроса.';
  } else if (status === 413 && !message) {
    code = 'REQUEST_TOO_LARGE';
    message = 'Запрос слишком большой. Максимальный размер – 16 Кбайт, не более 20 полей.';
  }
  if (!message) message = status < 500 ? 'Некорректный запрос.' : 'Внутренняя ошибка сервера. Повторите запрос после устранения причины.';
  const cause = err.cause || err;
  console.error(`[${req.requestId}] ${code}: ${cause.code || cause.name}: ${String(cause.message).slice(0, 500)}`);
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return res.status(status).json({ error: true, message, status, code, requestId: req.requestId });
  }
  return res.status(status).render('500', { status, message, requestId: req.requestId });
}

module.exports = errorHandler;
