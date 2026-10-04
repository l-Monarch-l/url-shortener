require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 URL Shortener API запущен на http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM получен, завершаем сервер...');
  server.close(() => {
    console.log('Сервер остановлен.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT получен, завершаем сервер...');
  server.close(() => {
    console.log('Сервер остановлен.');
    process.exit(0);
  });
});