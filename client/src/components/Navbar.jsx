import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar({ onCartOpen }) {
  const { itemCount } = useCart();
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 border-b border-wrap-rose/10 shadow-soft">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 py-3">
        <Link to="/" className="group flex items-center gap-2">
          <img src="/logo.png" alt="Wrapify" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
          <span style={{ display: 'none' }} className="font-display text-2xl tracking-tight">
            <span className="text-gradient font-bold">Wrapify</span>
            <span className="text-wrap-pink ml-1">✨</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <Link to="/" className={`btn-ghost ${loc.pathname === '/' ? 'bg-wrap-blush/60 text-wrap-rose' : ''}`}>Home</Link>
          <Link to="/build" className={`btn-ghost ${loc.pathname === '/build' ? 'bg-wrap-blush/60 text-wrap-rose' : ''}`}>Build Hamper</Link>
          <a href="/#products" className="btn-ghost">Ready Hampers</a>
        </nav>
        <button onClick={onCartOpen} className="relative btn-ghost">
          <span className="text-xl">🛍️</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-br from-wrap-pink to-wrap-rose text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-soft">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
