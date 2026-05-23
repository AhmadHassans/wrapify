export const imgUrl = (filename) => filename ? `/api/uploads/${filename}` : '';

export const thumbUrl = (filename) => {
  if (!filename) return '';
  if (filename.endsWith('_thumb.webp')) return `/api/uploads/${filename}`;
  if (filename.endsWith('.webp')) return `/api/uploads/${filename.replace(/\.webp$/, '_thumb.webp')}`;
  return `/api/uploads/${filename}`;
};

export const api = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async put(path, body) {
    const res = await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async del(path) {
    const res = await fetch(path, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  },
  async postForm(path, formData, method = 'POST') {
    const res = await fetch(path, { method, body: formData });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  }
};
