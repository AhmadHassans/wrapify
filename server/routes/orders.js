const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const db = require('../db');
const notify = require('../lib/notify');

const router = express.Router();

const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: receiptsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `r${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safe);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype);
  if (!ok) return cb(new Error('Only jpeg/png/webp images allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

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

const needsVerification = (method) => {
  const m = (method || '').toLowerCase();
  return ['jazzcash', 'easypaisa'].includes(m);
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
  for (const it of items) {
    if (!db.products.get(it.id)) {
      return res.status(400).json({ error: `Product ${it.id} not found` });
    }
  }

  const serverTotal = computeTotal({ items, packaging, addons });
  if (Math.abs(serverTotal - Number(total_price)) > 1) {
    return res.status(400).json({ error: 'Total mismatch', serverTotal });
  }

  const status = needsVerification(payment_method) ? 'pending_payment' : 'pending';

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
    status
  });

  const enrichedItems = items.map(it => {
    const p = db.products.get(it.id);
    return { ...it, name: p ? p.name : `Product #${it.id}` };
  });
  const enrichedAddons = addons.map(a => {
    const p = db.products.get(a.id);
    return { ...a, name: p ? p.name : `Add-on #${a.id}` };
  });
  notify.newOrder({ ...row, items: enrichedItems, addons: enrichedAddons }).catch(e => console.error('[notify] newOrder failed', e));

  res.status(201).json({
    ...formatOrder(row),
    payment_proof_required: needsVerification(payment_method)
  });
});

router.post('/:id/payment-proof', upload.single('receipt'), (req, res) => {
  const order = db.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'confirmed' || order.status === 'delivered') {
    return res.status(400).json({ error: 'Order already confirmed' });
  }

  const { sender_details = '', trx_id = '' } = req.body || {};
  if (!sender_details || !trx_id) {
    return res.status(400).json({ error: 'sender_details and trx_id required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Receipt screenshot required' });
  }

  const updated = db.orders.updatePayment(order.id, {
    sender_details: String(sender_details).trim(),
    trx_id: String(trx_id).trim(),
    receipt_image: req.file.filename,
    status: 'pending_verification'
  });

  const enrichedUpdated = {
    ...updated,
    items: (updated.items || []).map(it => {
      const p = db.products.get(it.id);
      return { ...it, name: it.name || (p ? p.name : `Product #${it.id}`) };
    }),
    addons: (updated.addons || []).map(a => {
      const p = db.products.get(a.id);
      return { ...a, name: a.name || (p ? p.name : `Add-on #${a.id}`) };
    })
  };
  notify.paymentProof(enrichedUpdated).catch(e => console.error('[notify] paymentProof failed', e));

  res.json({ success: true, order: formatOrder(updated) });
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
  const allowed = ['pending', 'pending_payment', 'pending_verification', 'confirmed', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const updated = db.orders.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, status });
});

module.exports = router;
