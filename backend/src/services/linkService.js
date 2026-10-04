const { customAlphabet } = require('nanoid');
const db = require('../db');

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 7;

const generateCode = customAlphabet(ALPHABET, CODE_LENGTH);

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSelfReference(urlString, baseUrl) {
  try {
    const url = new URL(urlString);
    const base = new URL(baseUrl);
    return url.hostname === base.hostname;
  } catch {
    return false;
  }
}

function createShortLink(originalUrl, baseUrl) {
  if (!isValidUrl(originalUrl)) {
    const error = new Error('Некорректный URL. Разрешены только http и https.');
    error.status = 400;
    throw error;
  }

  if (isSelfReference(originalUrl, baseUrl)) {
    const error = new Error('Нельзя сокращать ссылки на сам сервис.');
    error.status = 400;
    throw error;
  }

  const existing = db
    .prepare('SELECT code FROM links WHERE original_url = ?')
    .get(originalUrl);

  if (existing) {
    return { code: existing.code, shortUrl: `${baseUrl}/${existing.code}`, reused: true };
  }

  let code;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    code = generateCode();
    const collision = db.prepare('SELECT 1 FROM links WHERE code = ?').get(code);
    if (!collision) break;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    const error = new Error('Не удалось сгенерировать уникальный код. Попробуйте ещё раз.');
    error.status = 500;
    throw error;
  }

  db.prepare('INSERT INTO links (code, original_url) VALUES (?, ?)').run(code, originalUrl);

  return { code, shortUrl: `${baseUrl}/${code}`, reused: false };
}

function getLinkByCode(code) {
  return db.prepare('SELECT * FROM links WHERE code = ?').get(code);
}

function registerClick(code) {
  return db
    .prepare('UPDATE links SET clicks = clicks + 1, last_clicked_at = CURRENT_TIMESTAMP WHERE code = ?')
    .run(code);
}

function getAllLinks() {
  return db.prepare('SELECT * FROM links ORDER BY created_at DESC').all();
}

function deleteLink(code) {
  const result = db.prepare('DELETE FROM links WHERE code = ?').run(code);
  return result.changes > 0;
}

function getStats(code) {
  return db
    .prepare('SELECT code, original_url, clicks, created_at, last_clicked_at FROM links WHERE code = ?')
    .get(code);
}

module.exports = {
  createShortLink,
  getLinkByCode,
  registerClick,
  getAllLinks,
  deleteLink,
  getStats,
  isValidUrl,
  isSelfReference,
};