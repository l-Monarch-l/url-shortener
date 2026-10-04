const linkService = require('../src/services/linkService');

const db = require('../src/db');

beforeEach(() => {
  db.exec('DELETE FROM links');
});

describe('linkService.isValidUrl', () => {
  it('принимает http и https URL', () => {
    expect(linkService.isValidUrl('https://example.com')).toBe(true);
    expect(linkService.isValidUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('отклоняет невалидные URL', () => {
    expect(linkService.isValidUrl('not a url')).toBe(false);
    expect(linkService.isValidUrl('example.com')).toBe(false);
    expect(linkService.isValidUrl('ftp://example.com')).toBe(false);
    expect(linkService.isValidUrl('')).toBe(false);
    expect(linkService.isValidUrl(null)).toBe(false);
  });
});

describe('linkService.createShortLink', () => {
  it('создаёт короткую ссылку', () => {
    const result = linkService.createShortLink(
      'https://example.com/long/path',
      'http://localhost:3001'
    );

    expect(result.code).toHaveLength(7);
    expect(result.shortUrl).toBe(`http://localhost:3001/${result.code}`);
    expect(result.reused).toBe(false);
  });

  it('возвращает тот же код при повторном сокращении того же URL', () => {
    const first = linkService.createShortLink(
      'https://example.com/duplicate',
      'http://localhost:3001'
    );
    const second = linkService.createShortLink(
      'https://example.com/duplicate',
      'http://localhost:3001'
    );

    expect(second.code).toBe(first.code);
    expect(second.reused).toBe(true);
  });

  it('бросает ошибку при невалидном URL', () => {
    expect(() =>
      linkService.createShortLink('not a url', 'http://localhost:3001')
    ).toThrow('Некорректный URL');
  });

  it('запрещает сокращать ссылки на сам сервис', () => {
    expect(() =>
      linkService.createShortLink(
        'http://localhost:3001/abc',
        'http://localhost:3001'
      )
    ).toThrow('Нельзя сокращать ссылки на сам сервис');
  });

  it('генерирует разные коды для разных URL', () => {
    const a = linkService.createShortLink('https://a.com', 'http://localhost:3001');
    const b = linkService.createShortLink('https://b.com', 'http://localhost:3001');
    expect(a.code).not.toBe(b.code);
  });
});

describe('linkService.getLinkByCode / registerClick / deleteLink', () => {
  it('находит ссылку и увеличивает счётчик переходов', () => {
    const { code } = linkService.createShortLink(
      'https://example.com',
      'http://localhost:3001'
    );

    linkService.registerClick(code);
    linkService.registerClick(code);

    const link = linkService.getLinkByCode(code);
    expect(link.clicks).toBe(2);
    expect(link.last_clicked_at).toBeTruthy();
  });

  it('возвращает undefined для несуществующего кода', () => {
    expect(linkService.getLinkByCode('does-not-exist')).toBeUndefined();
  });

  it('удаляет ссылку и возвращает true', () => {
    const { code } = linkService.createShortLink(
      'https://example.com',
      'http://localhost:3001'
    );
    expect(linkService.deleteLink(code)).toBe(true);
    expect(linkService.getLinkByCode(code)).toBeUndefined();
  });

  it('возвращает false при удалении несуществующей ссылки', () => {
    expect(linkService.deleteLink('missing')).toBe(false);
  });
});

afterAll(() => {
  try { db.close(); } catch (_) { /* уже закрыта */ }
});