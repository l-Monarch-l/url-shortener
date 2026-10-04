const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.resolve(__dirname, 'test.db');

try {
  fs.rmSync(TEST_DB_PATH, { force: true });
  fs.rmSync(TEST_DB_PATH + '-wal', { force: true });
  fs.rmSync(TEST_DB_PATH + '-shm', { force: true });
} catch (err) {}

process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';
process.env.BASE_URL = 'http://localhost:3001';