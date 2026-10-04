const express = require('express');
const cors = require('cors');
const linkRoutes = require('./routes/links');
const redirectRoutes = require('./routes/redirect');
const healthRoutes = require('./routes/health');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/', healthRoutes);
app.use('/api', linkRoutes);
app.use('/', redirectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;