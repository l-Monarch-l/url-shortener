const express = require('express');
const router = express.Router();
const linkService = require('../services/linkService');

router.get('/:code', (req, res, next) => {
  try {
    const link = linkService.getLinkByCode(req.params.code);

    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }

    linkService.registerClick(link.code);
    res.redirect(302, link.original_url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;