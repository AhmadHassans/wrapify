import { useEffect, useLayoutEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import BuildHamper from './pages/BuildHamper.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import PaymentProof from './pages/PaymentProof.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import CursorTrail from './components/CursorTrail.jsx';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function ScrollManager() {
  const loc = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    const key = loc.key || 'default';

    if (navType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${key}`);
      if (saved !== null) {
        const y = parseInt(saved, 10);
        window.scrollTo(0, y);
        requestAnimationFrame(() => window.scrollTo(0, y));
        return;
      }
    }

    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [loc.key, navType]);

  useEffect(() => {
    const key = loc.key || 'default';
    const save = () => sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
    window.addEventListener('beforeunload', save);
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
    };
  }, [loc.key]);

  return null;
}

export default function App() {
  const loc = useLocation();
  const navType = useNavigationType();
  const isAdmin = loc.pathname.startsWith('/admin');
  const fadeKey = navType === 'POP' ? 'static' : loc.key;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handler = (e) => {
      const btn = e.target.closest && e.target.closest('.btn, .btn-primary, .btn-outline, .btn-ghost');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 620);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <ScrollManager />
      <CursorTrail />
      <div key={fadeKey} className="page-fade">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/build" element={<BuildHamper />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/payment/success" element={<PaymentResult success={true} />} />
          <Route path="/payment/fail" element={<PaymentResult success={false} />} />
          <Route path="/payment/proof/:orderId" element={<PaymentProof />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      {!isAdmin && <ChatWidget />}
    </>
  );
}
