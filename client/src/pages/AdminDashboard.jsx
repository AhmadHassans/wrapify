import { useEffect, useState, Fragment } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, imgUrl, thumbUrl } from '../lib/api.js';

const TABS = [
  { id: 'items', label: 'Items', emoji: '🛍️' },
  { id: 'packaging', label: 'Packaging', emoji: '📦' },
  { id: 'addons', label: 'Add-ons', emoji: '✨' },
  { id: 'orders', label: 'Orders', emoji: '🛒' },
  { id: 'add', label: 'Add Product', emoji: '➕' }
];

const filterByTab = (tab) => {
  if (tab === 'items') return (p) => !p.is_addon && !p.packaging_type;
  if (tab === 'packaging') return (p) => !!p.packaging_type;
  if (tab === 'addons') return (p) => !!p.is_addon;
  return () => true;
};

export default function AdminDashboard() {
  const nav = useNavigate();
  const loggedIn = localStorage.getItem('wrapify_admin') === '1';
  if (!loggedIn) return <Navigate to="/admin/login" replace />;

  const [tab, setTab] = useState('items');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadProducts = () => api.get('/api/products?all=1').then(setProducts).catch(console.error);
  const loadOrders = () => api.get('/api/orders').then(setOrders).catch(console.error);

  useEffect(() => { loadProducts(); loadOrders(); }, []);

  const logout = () => { localStorage.removeItem('wrapify_admin'); nav('/admin/login'); };

  const counts = {
    items: products.filter(filterByTab('items')).length,
    packaging: products.filter(filterByTab('packaging')).length,
    addons: products.filter(filterByTab('addons')).length,
    orders: orders.length,
    add: ''
  };

  const switchTab = (id) => { setTab(id); setEditing(null); setCreating(false); };

  const showForm = creating || editing || tab === 'add';
  const formType = editing
    ? (editing.is_addon ? 'addons' : (editing.packaging_type ? 'packaging' : 'items'))
    : (tab === 'add' ? 'all' : tab);

  return (
    <div className="min-h-screen bg-wrap-cream">
      <header className="bg-white border-b border-wrap-blush sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="font-display text-2xl">Wrapify Admin ✨</div>
          <button onClick={logout} className="btn-ghost text-sm">Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col md:flex-row gap-6">
        <aside className="md:w-56 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`text-left px-4 py-3 rounded-2xl whitespace-nowrap flex items-center justify-between gap-2 ${tab === t.id ? 'bg-wrap-pink text-white shadow-soft' : 'bg-white text-wrap-plum'}`}
            >
              <span><span className="mr-2">{t.emoji}</span>{t.label}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 ${tab === t.id ? 'bg-white/30' : 'bg-wrap-blush/60'}`}>{counts[t.id]}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1">
          {showForm ? (
            <ProductForm
              initial={editing}
              formType={formType}
              onDone={() => { setEditing(null); setCreating(false); if (tab === 'add') setTab('items'); loadProducts(); }}
            />
          ) : tab === 'orders' ? (
            <OrdersTable orders={orders} reload={loadOrders} />
          ) : (
            <ProductsTable
              products={products.filter(filterByTab(tab))}
              tab={tab}
              onAdd={() => setCreating(true)}
              onEdit={(p) => setEditing(p)}
              onChanged={loadProducts}
            />
          )}
        </main>
      </div>
    </div>
  );
}

const TAB_META = {
  items: { title: 'Items', singular: 'Item', addLabel: '+ Add Item', emptyIcon: '🛍️', emptyHint: 'Add your first product to start showing it in the Build Hamper flow.' },
  packaging: { title: 'Packaging', singular: 'Packaging Option', addLabel: '+ Add Packaging', emptyIcon: '📦', emptyHint: 'Add Basket, Gift Box, Transparent Box, or Net Wrapping.' },
  addons: { title: 'Add-ons', singular: 'Add-on', addLabel: '+ Add Add-on', emptyIcon: '✨', emptyHint: 'Add Eid cards, handwritten notes, or extra surprises.' }
};

function ProductsTable({ products, tab, onAdd, onEdit, onChanged }) {
  const meta = TAB_META[tab] || TAB_META.items;
  const toggleActive = async (p) => {
    const fd = new FormData();
    fd.append('is_active', p.is_active ? '0' : '1');
    await api.postForm(`/api/products/${p.id}`, fd, 'PUT');
    onChanged();
  };
  const del = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await api.del(`/api/products/${p.id}`);
    onChanged();
  };
  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-wrap-blush flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl">{meta.title} ({products.length})</h2>
        <button onClick={onAdd} className="btn-primary text-sm">{meta.addLabel}</button>
      </div>
      {products.length === 0 ? (
        <div className="p-12 text-center text-wrap-plum/60">
          <div className="text-5xl mb-2">{meta.emptyIcon}</div>
          <div className="font-display text-lg mb-1">No {meta.title.toLowerCase()} yet</div>
          <div className="text-sm">{meta.emptyHint}</div>
          <button onClick={onAdd} className="btn-primary text-sm mt-5">{meta.addLabel}</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-wrap-blush text-wrap-plum/70">
              <tr>
                <th className="text-left p-3">Image</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Price</th>
                {tab === 'items' && <th className="text-left p-3">Label</th>}
                {tab === 'items' && <th className="text-left p-3">Deal</th>}
                {tab === 'packaging' && <th className="text-left p-3">Type</th>}
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-wrap-blush/60">
                  <td className="p-3">
                    {p.images?.[0] && <img src={thumbUrl(p.images[0])} alt="" loading="lazy" decoding="async" width="48" height="48" className="w-12 h-12 rounded-xl object-cover" />}
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">Rs.{p.price}</td>
                  {tab === 'items' && <td className="p-3">{p.label || '—'}</td>}
                  {tab === 'items' && <td className="p-3">{p.deals || '—'}</td>}
                  {tab === 'packaging' && <td className="p-3"><span className="chip bg-blue-100 text-blue-700">{p.packaging_type}</span></td>}
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`chip ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => onEdit(p)} className="btn-ghost text-sm">✏️ Edit</button>
                    <button onClick={() => del(p)} className="btn-ghost text-sm text-red-500">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdersTable({ orders, reload }) {
  const [expanded, setExpanded] = useState(null);
  const statusColor = (s) => ({
    pending: 'bg-amber-100 text-amber-700',
    pending_payment: 'bg-orange-100 text-orange-700',
    pending_verification: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-500'
  }[s] || 'bg-gray-100');

  const changeStatus = async (id, status) => {
    await api.put(`/api/orders/${id}/status`, { status });
    reload();
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-wrap-blush">
        <h2 className="font-display text-xl">Orders ({orders.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-wrap-blush text-wrap-plum/70">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Payment</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <Fragment key={o.id}>
                <tr
                  className="border-t border-wrap-blush/60 cursor-pointer hover:bg-wrap-blush/40"
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                >
                  <td className="p-3 font-medium">#{o.id}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.phone}</td>
                  <td className="p-3">Rs.{o.total_price}</td>
                  <td className="p-3">{o.payment_method}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                      className={`chip ${statusColor(o.status)} cursor-pointer`}
                    >
                      <option value="pending">Pending</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-3 text-wrap-plum/60">{o.created_at}</td>
                </tr>
                {expanded === o.id && (
                  <tr className="bg-wrap-blush/40">
                    <td colSpan={7} className="p-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-1">Customer</div>
                          <div>{o.customer_name}</div>
                          <div>{o.phone}</div>
                          <div className="mt-2">{o.address}</div>
                          {o.budget && <div className="mt-2 text-wrap-plum/70">Budget: {o.budget}</div>}
                          {o.notes && <div className="mt-2"><span className="font-medium">Notes: </span>{o.notes}</div>}
                          {o.packaging && <div className="mt-2"><span className="font-medium">Packaging: </span>{o.packaging}</div>}
                        </div>
                        <div>
                          <div className="font-medium mb-1">Items</div>
                          <ul className="space-y-1">
                            {o.items.map((it, i) => (
                              <li key={i}>• {it.name || `Product #${it.id}`}{it.size ? ` (${it.size})` : ''}{it.variant ? ` · ${it.variant}` : ''} x{it.qty}</li>
                            ))}
                          </ul>
                          {o.addons.length > 0 && (
                            <>
                              <div className="font-medium mt-3 mb-1">Add-ons</div>
                              <ul className="space-y-1">
                                {o.addons.map((a, i) => <li key={i}>• {a.name || `Add-on #${a.id}`}</li>)}
                              </ul>
                            </>
                          )}
                        </div>
                        <div>
                          <div className="font-medium mb-1">Payment Proof</div>
                          {o.payment_method && o.payment_method !== 'COD' ? (
                            <div className="space-y-1">
                              <div><span className="font-medium">Method: </span>{o.payment_method}</div>
                              {o.sender_details && <div><span className="font-medium">Sender: </span>{o.sender_details}</div>}
                              {o.trx_id && <div><span className="font-medium">TRX ID: </span><span className="font-mono">{o.trx_id}</span></div>}
                              {o.receipt_image ? (
                                <a href={`/api/receipts/${o.receipt_image}`} target="_blank" rel="noreferrer" className="block mt-2">
                                  <img src={`/api/receipts/${o.receipt_image}`} alt="receipt" loading="lazy" decoding="async" className="w-full max-w-[200px] rounded-lg border border-wrap-pink/30 hover:shadow-pop transition" />
                                  <div className="text-xs text-wrap-rose mt-1 hover:underline">View full size →</div>
                                </a>
                              ) : (
                                <div className="text-xs text-wrap-plum/60 mt-2 italic">Receipt not uploaded yet</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-wrap-plum/60 italic">{o.payment_method === 'COD' ? 'Cash on Delivery' : '—'}</div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="p-8 text-center text-wrap-plum/60">No orders yet 🌸</div>}
      </div>
    </div>
  );
}

const FORM_META = {
  items: { title: 'Item', priceLabel: 'Price (Rs.)', showDescription: true, showLabel: true, showDeal: true, showVariants: true, showSizes: true, showImages: true, showPackagingType: false, showAddonToggle: false },
  packaging: { title: 'Packaging Option', priceLabel: 'Extra Cost (Rs.)', showDescription: true, showLabel: false, showDeal: false, showVariants: false, showSizes: false, showImages: true, showPackagingType: true, showAddonToggle: false },
  addons: { title: 'Add-on', priceLabel: 'Extra Cost (Rs.)', showDescription: false, showLabel: false, showDeal: false, showVariants: false, showSizes: false, showImages: true, showPackagingType: false, showAddonToggle: false },
  all: { title: 'Product', priceLabel: 'Base Price (Rs.)', showDescription: true, showLabel: true, showDeal: true, showVariants: true, showSizes: true, showImages: true, showPackagingType: true, showAddonToggle: true }
};

const FIXED_SIZES = ['Small', 'Medium', 'Large'];

function ProductForm({ initial, formType = 'items', onDone }) {
  const meta = FORM_META[formType] || FORM_META.items;
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price || 0);
  const [label, setLabel] = useState(initial?.label || '');
  const [packagingType, setPackagingType] = useState(initial?.packaging_type || (formType === 'packaging' ? 'basket' : ''));
  const [isAddonState, setIsAddonState] = useState(initial ? !!initial.is_addon : (formType === 'addons'));
  const [isActive, setIsActive] = useState(initial ? !!initial.is_active : true);
  const [deals, setDeals] = useState(initial?.deals || '');
  const [existingImages, setExistingImages] = useState(initial?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [variants, setVariants] = useState(initial?.variants || []);
  const [variantFiles, setVariantFiles] = useState({});
  const [sizeState, setSizeState] = useState(() => {
    const base = { Small: { enabled: false, price: '' }, Medium: { enabled: false, price: '' }, Large: { enabled: false, price: '' } };
    (initial?.sizes || []).forEach(s => { if (base[s.name]) base[s.name] = { enabled: true, price: s.price }; });
    return base;
  });
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial;
  const isAddon = formType === 'addons' ? true : (formType === 'all' ? isAddonState : false);

  const submit = async (e) => {
    e.preventDefault();
    if (formType === 'packaging' && !packagingType) {
      alert('Please pick a packaging type.');
      return;
    }
    const sizes = meta.showSizes
      ? FIXED_SIZES.filter(n => sizeState[n].enabled).map(n => ({ name: n, price: Number(sizeState[n].price) }))
      : [];
    for (const s of sizes) {
      if (!s.price || s.price <= 0) {
        alert(`Price required for ${s.name} (must be greater than 0).`);
        return;
      }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', meta.showDescription ? description : '');
      fd.append('price', price);
      fd.append('label', meta.showLabel ? label : '');
      const pt = formType === 'packaging' ? packagingType : (formType === 'all' ? packagingType : '');
      fd.append('packaging_type', pt);
      fd.append('is_addon', isAddon ? '1' : '0');
      fd.append('is_active', isActive ? '1' : '0');
      fd.append('deals', meta.showDeal ? deals : '');
      fd.append('existing_images', JSON.stringify(existingImages));
      fd.append('variants', meta.showVariants ? JSON.stringify(variants) : JSON.stringify([]));
      fd.append('sizes', JSON.stringify(sizes));
      newImages.forEach(f => fd.append('images', f));
      if (meta.showVariants) {
        Object.entries(variantFiles).forEach(([key, file]) => fd.append(key, file));
      }

      if (isEdit) {
        await api.postForm(`/api/products/${initial.id}`, fd, 'PUT');
      } else {
        await api.postForm('/api/products', fd, 'POST');
      }
      onDone();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (n) => setSizeState({ ...sizeState, [n]: { ...sizeState[n], enabled: !sizeState[n].enabled } });
  const setSizePrice = (n, val) => setSizeState({ ...sizeState, [n]: { ...sizeState[n], price: val } });

  const addVariant = () => setVariants([...variants, { color: '', price_add: 0, image: '' }]);
  const removeVariant = (i) => {
    setVariants(variants.filter((_, idx) => idx !== i));
    const next = { ...variantFiles }; delete next[`variant_image_${i}`]; setVariantFiles(next);
  };
  const updateVariant = (i, field, val) => {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  };

  return (
    <form onSubmit={submit} className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">{isEdit ? `Edit ${meta.title}` : `Add ${meta.title}`}</h2>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Name">
          <input value={name} onChange={e => setName(e.target.value)} required className="input" />
        </Field>
        <Field label={meta.priceLabel}>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required className="input" />
        </Field>
      </div>

      {meta.showDescription && (
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input" />
        </Field>
      )}

      {(formType === 'packaging' || formType === 'all') && (
        <Field label="Packaging Type">
          <select value={packagingType} onChange={e => setPackagingType(e.target.value)} required={formType === 'packaging'} className="input">
            {formType === 'all' && <option value="">None (regular product)</option>}
            <option value="basket">Basket</option>
            <option value="gift_box">Gift Box</option>
            <option value="transparent">Transparent Box</option>
            <option value="net">Net Wrapping</option>
          </select>
        </Field>
      )}

      {(meta.showLabel || meta.showDeal) && (
        <div className="grid md:grid-cols-2 gap-4">
          {meta.showLabel && (
            <Field label="Label">
              <select value={label} onChange={e => setLabel(e.target.value)} className="input">
                <option value="">None</option>
                <option value="Budget Friendly">Budget Friendly</option>
                <option value="Premium">Premium</option>
              </select>
            </Field>
          )}
          {meta.showDeal && (
            <Field label="Deal text">
              <input value={deals} onChange={e => setDeals(e.target.value)} placeholder="e.g. Buy 2 Get 1 Free" className="input" />
            </Field>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        {meta.showAddonToggle && (
          <Toggle label="Add-on item" value={isAddonState} onChange={setIsAddonState} />
        )}
        <Toggle label="Active (visible to customers)" value={isActive} onChange={setIsActive} />
      </div>

      {meta.showImages && (
        <div>
          <div className="text-sm font-medium mb-2">{formType === 'items' ? 'Images (first = cover)' : 'Image'}</div>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={thumbUrl(img)} alt="" loading="lazy" decoding="async" width="80" height="80" className="w-20 h-20 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                >×</button>
              </div>
            ))}
            {newImages.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" decoding="async" width="80" height="80" className="w-20 h-20 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                >×</button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple={formType === 'items'}
            onChange={e => setNewImages([...newImages, ...Array.from(e.target.files || [])])}
            className="mt-3 text-sm"
          />
        </div>
      )}

      {meta.showSizes && (
        <div>
          <div className="text-sm font-medium mb-2">Sizes (per-size pricing — overrides base price)</div>
          <div className="text-xs text-wrap-plum/60 mb-3">Tick a size to offer it. Price required when enabled.</div>
          <div className="space-y-3">
            {FIXED_SIZES.map(n => {
              const st = sizeState[n];
              return (
                <div key={n} className="flex flex-wrap items-center gap-3 p-3 bg-emerald-50/60 rounded-2xl">
                  <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={st.enabled}
                      onChange={() => toggleSize(n)}
                      className="w-5 h-5 accent-wrap-pink"
                    />
                    <span className="font-medium">{n}</span>
                  </label>
                  <input
                    type="number"
                    value={st.price}
                    onChange={e => setSizePrice(n, e.target.value)}
                    placeholder={`${n} Price Rs.`}
                    required={st.enabled}
                    disabled={!st.enabled}
                    min="1"
                    className="input flex-1 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {meta.showVariants && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Variants</div>
            <button type="button" onClick={addVariant} className="btn-ghost text-sm">+ Add Variant</button>
          </div>
          {variants.length === 0 && <div className="text-sm text-wrap-plum/60">No variants. Customers will see base product only.</div>}
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-wrap-blush/40 rounded-2xl">
                <input
                  value={v.color}
                  onChange={e => updateVariant(i, 'color', e.target.value)}
                  placeholder="Color name"
                  className="input flex-1 min-w-[140px]"
                />
                <input
                  type="number"
                  value={v.price_add}
                  onChange={e => updateVariant(i, 'price_add', Number(e.target.value))}
                  placeholder="+Rs."
                  className="input w-28"
                />
                {v.image && (
                  <img src={thumbUrl(v.image)} alt="" loading="lazy" decoding="async" width="48" height="48" className="w-12 h-12 rounded-xl object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setVariantFiles({ ...variantFiles, [`variant_image_${i}`]: file });
                  }}
                  className="text-xs"
                />
                <button type="button" onClick={() => removeVariant(i)} className="btn-ghost text-red-500">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-wrap-blush">
        <button type="button" onClick={onDone} className="btn-outline">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.65rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,182,193,0.5);
          background: #fff;
          outline: none;
        }
        .input:focus { border-color: #ffb6c1; }
      `}</style>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm text-wrap-plum/70 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full p-0.5 transition ${value ? 'bg-wrap-pink' : 'bg-gray-300'}`}
      >
        <span className={`block w-5 h-5 rounded-full bg-white transition ${value ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}
