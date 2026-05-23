import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/api/admin/login', { password });
      localStorage.setItem('wrapify_admin', '1');
      nav('/admin', { replace: true });
    } catch (e) {
      setError(e.message || 'Wrong password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wrap-blush via-wrap-cream to-white p-5">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="font-display text-2xl">Admin Login</h1>
          <p className="text-wrap-plum/60 text-sm">Wrapify ✨</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-pill border border-wrap-pink/40 bg-white focus:outline-none focus:border-wrap-pink"
        />
        {error && <div className="text-sm text-red-500 mt-2 text-center">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full mt-4 disabled:opacity-50">
          {loading ? 'Checking…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
