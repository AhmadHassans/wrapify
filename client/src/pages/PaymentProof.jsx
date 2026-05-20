import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

const METHODS = {
  jazzcash: { label: 'JazzCash', emoji: '📱', accent: 'from-red-400 to-orange-400' },
  easypaisa: { label: 'EasyPaisa', emoji: '💚', accent: 'from-emerald-500 to-green-400' },
  bank: { label: 'Bank Transfer', emoji: '🏦', accent: 'from-blue-500 to-indigo-500' }
};

const methodKey = (paymentMethod) => {
  const m = (paymentMethod || '').toLowerCase();
  if (m.includes('jazz')) return 'jazzcash';
  if (m.includes('easy')) return 'easypaisa';
  if (m.includes('bank')) return 'bank';
  return 'bank';
};

export default function PaymentProof() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [senderDetails, setSenderDetails] = useState('');
  const [trxId, setTrxId] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/orders/${orderId}`).catch(() => null),
      api.get('/api/payments/accounts').catch(() => null)
    ]).then(([o, a]) => {
      setOrder(o);
      setAccounts(a);
      setLoading(false);
    });
  }, [orderId]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type)) {
      setError('Only JPG, PNG, or WebP images allowed');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setError('');
    setReceipt(f);
    setReceiptPreview(URL.createObjectURL(f));
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!senderDetails.trim()) return setError('Enter sender name / mobile number');
    if (!trxId.trim()) return setError('Enter Transaction ID');
    if (!receipt) return setError('Upload receipt screenshot');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('sender_details', senderDetails.trim());
      fd.append('trx_id', trxId.trim());
      fd.append('receipt', receipt);
      const res = await fetch(`/api/orders/${orderId}/payment-proof`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
      clearCart();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => {}} />
        <div className="section">
          <div className="h-12 w-1/2 shimmer rounded mb-4" />
          <div className="h-40 shimmer rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => {}} />
        <div className="section text-center">
          <div className="text-6xl mb-3">🤔</div>
          <h1 className="font-display text-3xl">Order not found</h1>
          <Link to="/" className="btn-primary mt-6">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => {}} />
        <div className="section max-w-xl text-center">
          <div className="text-7xl mb-4 animate-bounceSoft">💌</div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">
            <span className="text-gradient">Payment details submitted!</span>
          </h1>
          <p className="text-wrap-plum/70 mb-2">Order #{order.id} · Rs.{order.total_price}</p>
          <div className="card p-6 mt-6 text-left bg-emerald-50/50 border-emerald-200">
            <p className="text-wrap-plum">
              ✨ The owner will verify your payment and confirm your order shortly.
              You'll get a WhatsApp message once confirmed.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/" className="btn-primary">Back to Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const key = methodKey(order.payment_method);
  const meta = METHODS[key];
  const acc = accounts?.[key];

  return (
    <div className="min-h-screen pb-16">
      <Navbar onCartOpen={() => {}} />
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-8">
        <Reveal>
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ Almost done</div>
            <h1 className="font-display text-4xl md:text-5xl">
              Complete <span className="text-gradient">payment</span>
            </h1>
            <p className="text-wrap-plum/70 mt-2">Order #{order.id} · Total <span className="font-semibold text-wrap-rose">Rs.{order.total_price}</span></p>
          </div>
        </Reveal>

        {/* Account Details */}
        <Reveal>
          <div className={`card p-6 mb-6 relative overflow-hidden border-0`}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.accent}`} />
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{meta.emoji}</span>
              <div>
                <div className="font-display text-xl">{meta.label}</div>
                <div className="text-xs text-wrap-plum/60">Send payment to this account</div>
              </div>
            </div>
            {acc ? (
              <div className="space-y-2">
                <AccountRow label="Account Title" value={acc.title} onCopy={copy} />
                {key === 'bank' && acc.bank && (
                  <AccountRow label="Bank" value={acc.bank} onCopy={copy} />
                )}
                {key === 'bank' && acc.iban && (
                  <AccountRow label="IBAN" value={acc.iban} onCopy={copy} mono />
                )}
                {(key === 'bank' && acc.account) && (
                  <AccountRow label="Account #" value={acc.account} onCopy={copy} mono />
                )}
                {(key !== 'bank') && (
                  <AccountRow label="Mobile Number" value={acc.number} onCopy={copy} mono />
                )}
                <AccountRow label="Amount" value={`Rs.${order.total_price}`} onCopy={() => copy(String(order.total_price))} highlight />
                <p className="text-xs text-wrap-plum/60 mt-3 italic">{acc.instructions}</p>
              </div>
            ) : (
              <div className="text-sm text-wrap-plum/70">Account details unavailable. Contact us on WhatsApp.</div>
            )}
          </div>
        </Reveal>

        {/* Proof Form */}
        <Reveal delay={120}>
          <form onSubmit={submit} className="card p-6 space-y-4">
            <div>
              <div className="font-display text-xl mb-1">Submit Payment Proof</div>
              <p className="text-sm text-wrap-plum/70">After paying, fill below so we can verify quickly.</p>
            </div>

            <Field label={key === 'bank' ? 'Sender Name / Account Title' : 'Sender Mobile Number / Name'}>
              <input
                value={senderDetails}
                onChange={e => setSenderDetails(e.target.value)}
                placeholder={key === 'bank' ? 'e.g. Ahmad Hassan' : 'e.g. 03001234567'}
                className="input"
                required
              />
            </Field>

            <Field label="Transaction ID (TRX ID)">
              <input
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                placeholder="e.g. 1234567890"
                className="input"
                required
              />
            </Field>

            <Field label="Receipt Screenshot">
              <div className="border-2 border-dashed border-wrap-pink/40 rounded-2xl p-5 text-center hover:border-wrap-rose transition-colors bg-wrap-blush/30">
                {receiptPreview ? (
                  <div className="space-y-3">
                    <img src={receiptPreview} alt="receipt" className="max-h-56 mx-auto rounded-xl shadow-soft" />
                    <button type="button" onClick={() => { setReceipt(null); setReceiptPreview(''); }} className="text-sm text-wrap-rose underline">
                      Choose different image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="text-4xl mb-2">📸</div>
                    <div className="font-medium text-wrap-plum">Click to upload screenshot</div>
                    <div className="text-xs text-wrap-plum/60 mt-1">JPG, PNG or WebP · max 5MB</div>
                    <input type="file" accept="image/*" onChange={onFile} className="hidden" />
                  </label>
                )}
              </div>
            </Field>

            {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">{error}</div>}

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Payment Proof 💌'}
            </button>

            <p className="text-xs text-wrap-plum/60 text-center pt-2">
              Your order will be confirmed once the owner verifies payment manually.
            </p>
          </form>
        </Reveal>
      </div>

      <Footer />

      <style>{`
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          border: 1px solid rgba(232, 80, 142, 0.25);
          background: #fff;
          outline: none;
        }
        .input:focus { border-color: #E8508E; }
      `}</style>
    </div>
  );
}

function AccountRow({ label, value, onCopy, mono, highlight }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-gradient-to-r from-wrap-pink/15 to-wrap-rose/15' : 'bg-wrap-cream'}`}>
      <div>
        <div className="text-xs text-wrap-plum/60 uppercase tracking-wider">{label}</div>
        <div className={`mt-0.5 ${mono ? 'font-mono' : ''} font-semibold ${highlight ? 'text-wrap-rose text-lg' : 'text-wrap-plum'}`}>{value}</div>
      </div>
      <button type="button" onClick={() => onCopy(value)} className="btn-ghost text-xs text-wrap-rose">📋 Copy</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-wrap-plum mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
