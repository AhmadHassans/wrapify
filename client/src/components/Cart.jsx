import { useCart } from '../context/CartContext.jsx';
import { imgUrl } from '../lib/api.js';
import { useNavigate } from 'react-router-dom';

export default function Cart({ open, onClose }) {
  const { items, removeItem, updateQty, total, packaging, addons, itemCount } = useCart();
  const nav = useNavigate();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-wrap-blush">
          <h3 className="font-display text-xl">Your Hamper 🛍️</h3>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>
        <div className="p-5 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 ? (
            <div className="text-center py-12 text-wrap-plum/60">
              <div className="text-4xl mb-2">🎀</div>
              Hamper empty. Add cute items!
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={`${it.id}:${it.variant || ''}`} className="flex gap-3">
                  {it.image && (
                    <img src={imgUrl(it.image)} alt="" className="w-16 h-16 rounded-2xl object-cover bg-wrap-blush" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{it.name}</div>
                    {it.variant && (
                      <div className="text-xs text-wrap-plum/60">{it.variant}</div>
                    )}
                    <div className="text-sm font-display mt-1">Rs.{(it.price + (it.variantPriceAdd || 0)) * it.qty}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(it.id, it.variant, it.qty - 1)} className="w-6 h-6 rounded-full bg-wrap-blush">-</button>
                      <span className="text-sm">{it.qty}</span>
                      <button onClick={() => updateQty(it.id, it.variant, it.qty + 1)} className="w-6 h-6 rounded-full bg-wrap-blush">+</button>
                      <button onClick={() => removeItem(it.id, it.variant)} className="ml-auto text-xs text-wrap-plum/60 hover:text-wrap-pink">remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {packaging && (
            <div className="mt-6 p-3 bg-wrap-blush rounded-2xl text-sm">
              <div className="font-medium">📦 {packaging.name}</div>
              <div className="text-wrap-plum/70">Rs.{packaging.price}</div>
            </div>
          )}
          {addons.length > 0 && (
            <div className="mt-3 p-3 bg-wrap-blush rounded-2xl text-sm">
              <div className="font-medium mb-1">✨ Add-ons</div>
              {addons.map(a => (
                <div key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span>Rs.{a.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-wrap-blush bg-white">
          <div className="flex justify-between mb-3">
            <span className="text-wrap-plum/70">Total</span>
            <span className="font-display text-2xl">Rs.{total}</span>
          </div>
          <button
            disabled={itemCount === 0}
            onClick={() => { onClose(); nav('/build'); }}
            className="btn-primary w-full disabled:opacity-50"
          >
            Build Hamper 💌
          </button>
        </div>
      </aside>
    </>
  );
}
