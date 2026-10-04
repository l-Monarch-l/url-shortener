const BASE = '/api';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  shorten: (url) =>
    fetch(`${BASE}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).then(handleResponse),

  listLinks: () => fetch(`${BASE}/links`).then(handleResponse),

  deleteLink: (code) =>
    fetch(`${BASE}/links/${code}`, { method: 'DELETE' }).then(handleResponse),

  getStats: (code) => fetch(`${BASE}/stats/${code}`).then(handleResponse),
};