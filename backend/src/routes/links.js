const express = require('express');
const router = express.Router();
const linkService = require('../services/linkService');

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

router.post('/shorten', (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Поле "url" обязательно' });
    }

    const result = linkService.createShortLink(url, getBaseUrl(req));

    res.status(result.reused ? 200 : 201).json({
      code: result.code,
      shortUrl: result.shortUrl,
      originalUrl: url,
      reused: result.reused,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/links', (req, res, next) => {
  try {
    const links = linkService.getAllLinks();
    const baseUrl = getBaseUrl(req);
    res.json(
      links.map((link) => ({
        ...link,
        shortUrl: `${baseUrl}/${link.code}`,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/stats/:code', (req, res, next) => {
  try {
    const stats = linkService.getStats(req.params.code);

    if (!stats) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }

    res.json({
      ...stats,
      shortUrl: `${getBaseUrl(req)}/${stats.code}`,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/links/:code', (req, res, next) => {
  try {
    const deleted = linkService.deleteLink(req.params.code);

    if (!deleted) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;