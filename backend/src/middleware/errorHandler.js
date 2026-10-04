function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };