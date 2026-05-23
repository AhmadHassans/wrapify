import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Cart from '../components/Cart.jsx';
import { api, imgUrl, thumbUrl } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

const STEPS = [
  { id: 1, label: 'Budget' },
  { id: 2, label: 'Items' },
  { id: 3, label: 'Packaging' },
  { id: 4, label: 'Add-ons' },
  { id: 5, label: 'Notes' },
  { id: 6, label: 'Checkout' }
];

const BUDGETS = ['499', '799', '999', '1499', 'custom'];

const PACK_META = {
  basket: { name: 'Basket', emoji: '🧺' },
  gift_box: { name: 'Gift Box', emoji: '🎁' },
  transparent: { name: 'Transparent Box', emoji: '📦' },
  net: { name: 'Net Wrap', emoji: '🎀' }
};

export default function BuildHamper() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [form, setForm] = useState({ customer_name: '', address: '', phone: '', payment_method: 'jazzcash' });
  const [paymentStatus, setPaymentStatus] = useState({ jazzcash: false, easypaisa: false });

  useEffect(() => {
    fetch('/api/payments/status').then(r => r.json()).then(setPaymentStatus).catch(() => {});
  }, []);
  const [customBudget, setCustomBudget] = useState('');

  const cart = useCart();
  const { items, packaging, addons, notes, budget, total, setPackaging, setNotes, setBudget, toggleAddon, clearCart } = cart;

  useEffect(() => {
    api.get('/api/products').then(setProducts).catch(console.error);
  }, []);

  const items_for_purchase = products.filter(p => !p.is_addon && !p.packaging_type);
  const addonProducts = products.filter(p => p.is_addon);
  const packagingProducts = products.filter(p => p.packaging_type);

  const next = () => setStep(s => Math.min(STEPS.length, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const placeOrder = async () => {
    if (!form.customer_name || !form.address || !form.phone) {
      alert('Please fill name, address, phone');
      return;
    }
    if (items.length === 0) {
      alert('Hamper is empty');
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_name: form.customer_name,
        address: form.address,
        phone: form.phone,
        payment_method: form.payment_method,
        items: items.map(i => ({ id: i.id, qty: i.qty, variant: i.variant, size: i.size })),
        packaging: packaging ? { id: packaging.id, name: packaging.name } : null,
        addons: addons.map(a => ({ id: a.id, qty: a.qty || 1 })),
        notes,
        budget,
        total_price: total
      };
      const res = await api.post('/api/orders', payload);

      if (res.payment_proof_required) {
        nav(`/payment/proof/${res.id}`);
        return;
      }

      setOrderResult(res);
    } catch (e) {
      alert('Order failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const waMessage = useMemo(() => {
    if (!orderResult) return '';
    const lines = [
      'New Order from Wrapify! 💖',
      '',
      `Order #${orderResult.id}`,
      `Customer: ${form.customer_name}`,
      `Phone: ${form.phone}`,
      `Address: ${form.address}`,
      `Payment: ${form.payment_method}`,
      '',
      'Items:'
    ];
    items.forEach(it => {
      lines.push(`• ${it.name}${it.size ? ` [${it.size}]` : ''}${it.variant ? ` (${it.variant})` : ''} x${it.qty} — Rs.${(it.price + (it.variantPriceAdd || 0)) * it.qty}`);
    });
    if (packaging) lines.push('', `Packaging: ${packaging.name} — Rs.${packaging.price}`);
    if (addons.length) {
      lines.push('', 'Add-ons:');
      addons.forEach(a => lines.push(`• ${a.name} — Rs.${a.price}`));
    }
    if (notes) lines.push('', `Notes: ${notes}`);
    lines.push('', `Total: Rs.${orderResult.total_price}`);
    return encodeURIComponent(lines.join('\n'));
  }, [orderResult, form, items, packaging, addons, notes]);

  const waNum = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567';

  if (orderResult) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="section text-center max-w-xl">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="font-display text-4xl mb-3">Order placed!</h1>
          <p className="text-wrap-plum/70 mb-2">Order #{orderResult.id} — Rs.{orderResult.total_price}</p>
          <p className="text-wrap-plum/70 mb-6">Tap below to confirm via WhatsApp. We'll start wrapping your hamper 🎀</p>
          <a
            href={`https://wa.me/${waNum}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            onClick={() => { clearCart(); }}
          >
            💬 Send WhatsApp Confirmation
          </a>
          <div className="mt-4">
            <button onClick={() => { clearCart(); nav('/'); }} className="btn-ghost">Back to home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-8">
        <StepDots step={step} onStepClick={setStep} />

        {step === 1 && (
          <div className="mt-10 text-center animate-fadeUp">
            <h2 className="font-display text-3xl md:text-4xl">Pick your budget 💸</h2>
            <p className="text-wrap-plum/70 mt-2">We'll show items that fit. No filtering — just a vibe.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {BUDGETS.map(b => {
                const isSelected = budget === (b === 'custom' ? `custom:${customBudget}` : `Rs.${b}`);
                return (
                  <button
                    key={b}
                    onClick={() => setBudget(b === 'custom' ? `custom:${customBudget || '0'}` : `Rs.${b}`)}
                    className={`btn ${isSelected ? 'bg-wrap-pink text-white' : 'bg-white border border-wrap-pink text-wrap-plum'} shadow-soft`}
                  >
                    {b === 'custom' ? 'Custom' : `Rs.${b}`}
                  </button>
                );
              })}
            </div>
            {budget?.startsWith('custom') && (
              <div className="mt-4">
                <input
                  type="number"
                  value={customBudget}
                  onChange={e => { setCustomBudget(e.target.value); setBudget(`custom:${e.target.value}`); }}
                  placeholder="Your budget Rs."
                  className="px-5 py-3 rounded-pill border border-wrap-pink bg-white text-center"
                />
              </div>
            )}
            {budget && (
              <p className="mt-6 text-wrap-rose">Perfect! Here are some items you can mix & match within your budget 💖</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-10 animate-fadeUp">
            <h2 className="font-display text-3xl md:text-4xl">Pick your goodies 🛍️</h2>
            <p className="text-wrap-plum/70 mt-1">Tap to add. Your hamper updates live.</p>
            {items_for_purchase.length === 0 ? (
              <div className="mt-10 card p-10 text-center text-wrap-plum/60">
                <div className="text-4xl mb-2">🌸</div>
                <div className="font-display text-lg">No items available yet.</div>
                <div className="text-sm mt-1">Admin can add products from the Admin panel.</div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-5">
                {items_for_purchase.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="mt-10 animate-fadeUp">
            <h2 className="font-display text-3xl md:text-4xl">Choose packaging 📦</h2>
            {packagingProducts.length === 0 && (
              <div className="mt-10 card p-10 text-center text-wrap-plum/60">
                <div className="text-4xl mb-2">📦</div>
                <div className="font-display text-lg">No packaging options yet.</div>
                <div className="text-sm mt-1">Admin can add packaging from the Admin panel.</div>
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {packagingProducts.map(p => {
                const meta = PACK_META[p.packaging_type] || { name: p.name, emoji: '📦' };
                const selected = packaging?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPackaging({ id: p.id, name: meta.name, price: p.price, type: p.packaging_type })}
                    className={`card p-5 text-center transition ${selected ? 'ring-2 ring-wrap-pink' : ''}`}
                  >
                    <div className="text-4xl mb-2">{meta.emoji}</div>
                    {p.images?.[0] && <img src={thumbUrl(p.images[0])} alt="" loading="lazy" decoding="async" width="400" height="280" className="w-full h-28 object-cover rounded-2xl mb-2" />}
                    <div className="font-display">{meta.name}</div>
                    <div className="text-wrap-plum/70 text-sm">Rs.{p.price}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-10 animate-fadeUp">
            <h2 className="font-display text-3xl md:text-4xl">Add-ons ✨</h2>
            <p className="text-wrap-plum/70 mt-1">Optional. Add a card, note, or surprise.</p>
            {addonProducts.length === 0 && (
              <div className="mt-10 card p-10 text-center text-wrap-plum/60">
                <div className="text-4xl mb-2">✨</div>
                <div className="font-display text-lg">No add-ons available yet.</div>
                <div className="text-sm mt-1">You can skip this step.</div>
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {addonProducts.map(p => {
                const selected = addons.some(a => a.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleAddon(p)}
                    className={`card p-4 text-left transition ${selected ? 'ring-2 ring-wrap-pink' : ''}`}
                  >
                    {p.images?.[0] && <img src={thumbUrl(p.images[0])} alt="" loading="lazy" decoding="async" width="400" height="280" className="w-full h-28 object-cover rounded-2xl mb-2" />}
                    <div className="font-display">{p.name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-wrap-plum/70 text-sm">Rs.{p.price}</span>
                      <span className="text-lg">{selected ? '✅' : '➕'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-10 animate-fadeUp max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl">Notes 💌</h2>
            <p className="text-wrap-plum/70 mt-1">Color theme? Special message? Tell us.</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              className="mt-4 w-full p-4 rounded-3xl border border-wrap-pink/40 bg-white focus:outline-none focus:border-wrap-pink"
              placeholder="e.g. Pastel pink theme, message: 'Eid Mubarak Ammi!'"
            />
          </div>
        )}

        {step === 6 && (
          <div className="mt-10 animate-fadeUp max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl">Checkout 💖</h2>
            <div className="mt-6 space-y-3">
              <Input label="Full Name" value={form.customer_name} onChange={v => setForm({ ...form, customer_name: v })} />
              <Input label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
              <Input label="Phone (WhatsApp)" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
              <div>
                <label className="text-sm text-wrap-plum/70 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <PayBtn active={form.payment_method === 'jazzcash'} onClick={() => setForm({ ...form, payment_method: 'jazzcash' })}>
                    📱 JazzCash
                  </PayBtn>
                  <PayBtn active={form.payment_method === 'easypaisa'} onClick={() => setForm({ ...form, payment_method: 'easypaisa' })}>
                    💚 EasyPaisa
                  </PayBtn>
                </div>
                <p className="text-xs text-wrap-plum/60 mt-2">
                  After placing order, you'll see account details to pay manually and upload a receipt screenshot for verification.
                </p>
              </div>
              <div className="card p-4 mt-4 bg-wrap-blush">
                <div className="flex justify-between"><span>Items</span><span>Rs.{cart.itemsTotal}</span></div>
                {packaging && <div className="flex justify-between"><span>{packaging.name}</span><span>Rs.{cart.packagingTotal}</span></div>}
                {addons.length > 0 && <div className="flex justify-between"><span>Add-ons</span><span>Rs.{cart.addonsTotal}</span></div>}
                <div className="border-t border-wrap-pink/30 mt-2 pt-2 flex justify-between font-display text-xl">
                  <span>Total</span><span>Rs.{total}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? 'Placing…' : 'Place Order 💌'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-wrap-rose/15 shadow-pop z-30">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <button onClick={prev} disabled={step === 1} className="btn-outline disabled:opacity-40 text-sm">← Back</button>
          <div className="text-sm text-wrap-plum/70 hidden sm:flex items-center gap-2">
            <span className="text-wrap-rose font-semibold animate-pulseSoft">{items.length}</span>
            item{items.length === 1 ? '' : 's'} · <span className="font-display text-wrap-rose">Rs.{total}</span>
          </div>
          {step < STEPS.length ? (
            <button onClick={next} className="btn-primary text-sm">Next →</button>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function StepDots({ step, onStepClick }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
      {STEPS.map(s => {
        const isCompleted = step > s.id;
        const isCurrent = step === s.id;
        const clickable = isCompleted;
        return (
          <button
            key={s.id}
            type="button"
            onClick={clickable ? () => onStepClick(s.id) : undefined}
            disabled={!clickable}
            aria-label={clickable ? `Go back to ${s.label}` : s.label}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-500 ${
              step >= s.id
                ? 'bg-gradient-to-r from-wrap-pink to-wrap-rose text-white shadow-soft'
                : 'bg-wrap-blush/60 text-wrap-plum/60'
            } ${isCurrent ? 'scale-110' : ''} ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-pop' : 'cursor-default'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.id ? 'bg-white/30' : 'bg-white'}`}>
              {isCompleted ? '✓' : s.id}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function PayBtn({ active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn text-sm ${active ? 'bg-gradient-to-r from-wrap-pink to-wrap-rose text-white' : 'bg-white border border-wrap-pink/40 text-wrap-plum'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pop'}`}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-wrap-plum/70 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-pill border border-wrap-pink/40 bg-white focus:outline-none focus:border-wrap-pink"
      />
    </div>
  );
}
