const express = require('express');
const db = require('../db');

const router = express.Router();

const formatOrder = (o) => ({
  ...o,
  items: Array.isArray(o.items) ? o.items : [],
  addons: Array.isArray(o.addons) ? o.addons : []
});

const computeTotal = ({ items = [], packaging, addons = [] }) => {
  let total = 0;
  for (const it of items) {
    const p = db.products.get(it.id);
    if (!p) continue;
    let unit = Number(p.price) || 0;
    if (it.size) {
      const sizes = Array.isArray(p.sizes) ? p.sizes : [];
      const s = sizes.find(s => s.name === it.size);
      if (s) unit = Number(s.price) || unit;
    }
    if (it.variant) {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const v = variants.find(v => v.color === it.variant);
      if (v) unit += Number(v.price_add) || 0;
    }
    const qty = Math.max(1, Number(it.qty) || 1);
    total += unit * qty;
  }
  if (packaging && packaging.id) {
    const p = db.products.get(packaging.id);
    if (p) total += Number(p.price) || 0;
  }
  for (const a of addons) {
    const p = db.products.get(a.id);
    if (!p) continue;
    const qty = Math.max(1, Number(a.qty) || 1);
    total += (Number(p.price) || 0) * qty;
  }
  return total;
};

router.post('/', (req, res) => {
  const {
    customer_name, address, phone, payment_method,
    items = [], packaging = null, addons = [],
    notes = '', budget = '', total_price = 0
  } = req.body;

  if (!customer_name || !address || !phone || !payment_method) {
    return res.status(400).json({ error: 'Missing customer fields' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart empty' });
  }

  const serverTotal = computeTotal({ items, packaging, addons });
  if (Math.abs(serverTotal - Number(total_price)) > 1) {
    return res.status(400).json({ error: 'Total mismatch', serverTotal });
  }

  const row = db.orders.insert({
    customer_name,
    address,
    phone,
    payment_method,
    items,
    packaging: packaging ? (packaging.name || packaging.label || '') : '',
    addons,
    notes,
    budget,
    total_price: serverTotal,
    status: 'pending'
  });

  res.status(201).json(formatOrder(row));
});

router.get('/', (req, res) => {
  res.json(db.orders.all().map(formatOrder));
});

router.get('/:id', (req, res) => {
  const o = db.orders.get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  res.json(formatOrder(o));
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const updated = db.orders.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, status });
});

module.exports = router;
