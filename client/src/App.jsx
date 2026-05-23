import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import BuildHamper from './pages/BuildHamper.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import PaymentProof from './pages/PaymentProof.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ChatWidget from './components/ChatWidget.jsx';

function ScrollManager() {
  const loc = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const key = loc.key || 'default';

    if (navType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${key}`);
      if (saved !== null) {
        window.scrollTo(0, parseInt(saved, 10));
        return;
      }
    }

    window.scrollTo(0, 0);
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
  const isAdmin = loc.pathname.startsWith('/admin');

  return (
    <>
      <ScrollManager />
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
      {!isAdmin && <ChatWidget />}
    </>
  );
}
