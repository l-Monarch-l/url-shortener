const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

beforeEach(() => {
  db.exec('DELETE FROM links');
});

describe('GET /health', () => {
  it('возвращает статус ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('POST /api/shorten', () => {
  it('создаёт короткую ссылку и возвращает 201', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com/long' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body.reused).toBe(false);
  });

  it('возвращает 200 и тот же код при повторном запросе', async () => {
    const url = 'https://example.com/duplicate';
    const first = await request(app).post('/api/shorten').send({ url });
    const second = await request(app).post('/api/shorten').send({ url });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.code).toBe(first.body.code);
    expect(second.body.reused).toBe(true);
  });

  it('возвращает 400 при невалидном URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Некорректный URL/);
  });

  it('возвращает 400 без поля url', async () => {
    const res = await request(app).post('/api/shorten').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /:code (redirect)', () => {
  it('редиректит на оригинальный URL', async () => {
    const create = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com/target' });

    const res = await request(app).get(`/${create.body.code}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/target');
  });

  it('возвращает 404 для несуществующего кода', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('увеличивает счётчик переходов', async () => {
    const create = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com/count' });

    await request(app).get(`/${create.body.code}`);
    await request(app).get(`/${create.body.code}`);

    const stats = await request(app).get(`/api/stats/${create.body.code}`);
    expect(stats.body.clicks).toBe(2);
  });
});

describe('GET /api/links', () => {
  it('возвращает пустой массив изначально', async () => {
    const res = await request(app).get('/api/links');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('возвращает список созданных ссылок', async () => {
    await request(app).post('/api/shorten').send({ url: 'https://a.com' });
    await request(app).post('/api/shorten').send({ url: 'https://b.com' });

    const res = await request(app).get('/api/links');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('DELETE /api/links/:code', () => {
  it('удаляет ссылку и возвращает 204', async () => {
    const create = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com/delete' });

    const res = await request(app).delete(`/api/links/${create.body.code}`);
    expect(res.status).toBe(204);
  });

  it('возвращает 404 при удалении несуществующей ссылки', async () => {
    const res = await request(app).delete('/api/links/missing');
    expect(res.status).toBe(404);
  });
});

describe('404 для неизвестных маршрутов', () => {
  it('возвращает JSON с ошибкой', async () => {
    const res = await request(app).get('/unknown/path');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Маршрут не найден');
  });
});

afterAll(() => {
  try { db.close(); } catch (_) { /* уже закрыта */ }
});