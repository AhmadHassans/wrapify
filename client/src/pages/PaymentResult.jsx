import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useEffect } from 'react';

export default function PaymentResult({ success }) {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const orderId = params.get('order');
  const reason = params.get('reason') || params.get('code') || params.get('status');
  const { clearCart } = useCart();

  useEffect(() => {
    if (success) clearCart();
  }, [success]);

  return (
    <div className="min-h-screen">
      <Navbar onCartOpen={() => {}} />
      <div className="section text-center max-w-xl">
        <div className="text-7xl mb-4 animate-bounceSoft">{success ? '🎉' : '😔'}</div>
        <h1 className="font-display text-4xl md:text-5xl mb-3">
          {success ? <span className="text-gradient">Payment Successful</span> : 'Payment Failed'}
        </h1>
        {orderId && <p className="text-wrap-plum/70 mb-2">Order #{orderId}</p>}
        {!success && reason && <p className="text-sm text-wrap-plum/60 mb-3">Reason: {reason}</p>}
        <p className="text-wrap-plum/70 mb-6">
          {success
            ? 'Thank you! Your hamper order is confirmed. We will WhatsApp you shortly with delivery details 💖'
            : 'Don\'t worry — your hamper is saved. You can retry payment or contact us on WhatsApp.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Back to Home</Link>
          {!success && <Link to="/build" className="btn-outline">Try Again</Link>}
        </div>
      </div>
      <Footer />
    </div>
  );
}
