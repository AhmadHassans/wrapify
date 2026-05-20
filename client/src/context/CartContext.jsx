import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'wrapify_cart_v1';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export function CartProvider({ children }) {
  const initial = loadState() || {
    items: [],
    packaging: null,
    addons: [],
    notes: '',
    budget: ''
  };

  const [items, setItems] = useState(initial.items);
  const [packaging, setPackaging] = useState(initial.packaging);
  const [addons, setAddons] = useState(initial.addons);
  const [notes, setNotes] = useState(initial.notes);
  const [budget, setBudget] = useState(initial.budget);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, packaging, addons, notes, budget }));
  }, [items, packaging, addons, notes, budget]);

  const addItem = (product, variant = null, qty = 1) => {
    setItems(prev => {
      const key = `${product.id}:${variant?.color || ''}`;
      const idx = prev.findIndex(p => `${p.id}:${p.variant || ''}` === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      const variantPriceAdd = variant ? Number(variant.price_add) || 0 : 0;
      const unitPrice = Number(product.price) || 0;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: unitPrice,
          variantPriceAdd,
          variant: variant ? variant.color : null,
          image: variant?.image || product.images?.[0] || '',
          qty
        }
      ];
    });
  };

  const removeItem = (id, variant = null) => {
    setItems(prev => prev.filter(p => !(p.id === id && (p.variant || null) === (variant || null))));
  };

  const updateQty = (id, variant, qty) => {
    setItems(prev => prev
      .map(p => (p.id === id && (p.variant || null) === (variant || null)) ? { ...p, qty: Math.max(1, qty) } : p)
    );
  };

  const toggleAddon = (product) => {
    setAddons(prev => {
      const exists = prev.find(a => a.id === product.id);
      if (exists) return prev.filter(a => a.id !== product.id);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price) || 0, qty: 1 }];
    });
  };

  const clearCart = () => {
    setItems([]); setPackaging(null); setAddons([]); setNotes(''); setBudget('');
  };

  const itemsTotal = useMemo(() => items.reduce((s, it) => s + (it.price + (it.variantPriceAdd || 0)) * it.qty, 0), [items]);
  const addonsTotal = useMemo(() => addons.reduce((s, a) => s + a.price * (a.qty || 1), 0), [addons]);
  const packagingTotal = packaging ? Number(packaging.price) || 0 : 0;
  const total = itemsTotal + addonsTotal + packagingTotal;

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const value = {
    items, packaging, addons, notes, budget,
    setPackaging, setNotes, setBudget,
    addItem, removeItem, updateQty, toggleAddon, clearCart,
    itemsTotal, addonsTotal, packagingTotal, total, itemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
