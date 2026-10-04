import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);
  const [copied, setCopied] = useState('');

  const loadLinks = useCallback(async () => {
    try {
      const data = await api.listLinks();
      setLinks(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError('');
    setLoading(true);
    try {
      const result = await api.shorten(url.trim());
      setLastCreated(result);
      setUrl('');
      await loadLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Удалить ссылку ${code}?`)) return;
    try {
      await api.deleteLink(code);
      setLinks((prev) => prev.filter((l) => l.code !== code));
      if (lastCreated?.code === code) setLastCreated(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = async (text, code) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(code);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Не удалось скопировать');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🔗 URL Shortener</h1>
        <p>Сокращайте ссылки и следите за переходами</p>
      </header>

      <form onSubmit={handleSubmit} className="shorten-form">
        <input
          type="url"
          placeholder="https://example.com/very/long/url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Сокращаю...' : 'Сократить'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {lastCreated && (
        <div className="created">
          <p>✅ Готово!</p>
          <div className="created-row">
            <a href={lastCreated.shortUrl} target="_blank" rel="noreferrer">
              {lastCreated.shortUrl}
            </a>
            <button onClick={() => handleCopy(lastCreated.shortUrl, lastCreated.code)}>
              {copied === lastCreated.code ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>
      )}

      <section className="links">
        <div className="links-header">
          <h2>Все ссылки ({links.length})</h2>
          <button onClick={loadLinks} className="refresh">Обновить</button>
        </div>

        {links.length === 0 ? (
          <p className="empty">Пока нет ни одной ссылки. Создайте первую!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Код</th>
                <th>Оригинал</th>
                <th>Переходы</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.code}>
                  <td>
                    <a href={link.shortUrl} target="_blank" rel="noreferrer">
                      {link.code}
                    </a>
                  </td>
                  <td className="original" title={link.original_url}>
                    {link.original_url}
                  </td>
                  <td>{link.clicks}</td>
                  <td>
                    <button
                      className="delete"
                      onClick={() => handleDelete(link.code)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;