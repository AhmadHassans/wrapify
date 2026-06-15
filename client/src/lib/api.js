const API_BASE = import.meta.env.VITE_API_BASE || '';

const url = (path) => path.startsWith('http') ? path : `${API_BASE}${path}`;

export const imgUrl = (filename) => filename ? `${API_BASE}/api/uploads/${filename}` : '';

export const thumbUrl = (filename) => {
  if (!filename) return '';
  if (filename.endsWith('_thumb.webp')) return `${API_BASE}/api/uploads/${filename}`;
  if (filename.endsWith('.webp')) return `${API_BASE}/api/uploads/${filename.replace(/\.webp$/, '_thumb.webp')}`;
  return `${API_BASE}/api/uploads/${filename}`;
};

export const api = {
  async get(path) {
    const res = await fetch(url(path));
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async put(path, body) {
    const res = await fetch(url(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async del(path) {
    const res = await fetch(url(path), { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async postForm(path, formData, method = 'POST') {
    const res = await fetch(url(path), { method, body: formData });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  }
};
