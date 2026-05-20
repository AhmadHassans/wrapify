import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import BuildHamper from './pages/BuildHamper.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ChatWidget from './components/ChatWidget.jsx';

export default function App() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/build" element={<BuildHamper />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/payment/success" element={<PaymentResult success={true} />} />
        <Route path="/payment/fail" element={<PaymentResult success={false} />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      {!isAdmin && <ChatWidget />}
    </>
  );
}
