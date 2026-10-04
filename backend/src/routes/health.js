const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    service: 'URL Shortener API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      shorten: 'POST /api/shorten',
      stats: 'GET /api/stats/:code',
      links: 'GET /api/links',
      delete: 'DELETE /api/links/:code',
      redirect: 'GET /:code',
      health: 'GET /health',
    },
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;