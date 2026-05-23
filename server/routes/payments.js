const express = require('express');
const db = require('../db');
const jazzcash = require('../lib/jazzcash');

const router = express.Router();

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://wrapifyoffical.com';

router.get('/status', (req, res) => {
  res.json({
    jazzcash: jazzcash.isConfigured(),
    publicUrl: PUBLIC_URL
  });
});

router.get('/accounts', (req, res) => {
  res.json({
    jazzcash: {
      title: process.env.ACCOUNT_JAZZCASH_NAME || 'Wrapify',
      number: process.env.ACCOUNT_JAZZCASH_NUMBER || '03236313345',
      instructions: 'Send the exact total amount to this JazzCash mobile account. After paying, enter the TRX ID and upload screenshot.'
    }
  });
});

router.post('/initiate/:orderId', (req, res) => {
  const order = db.orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Order not pending' });

  const method = (order.payment_method || '').toLowerCase();

  try {
    if (method === 'jazzcash') {
      if (!jazzcash.isConfigured()) {
        return res.status(503).json({ error: 'JazzCash not configured yet. Please contact support on WhatsApp.' });
      }
      const { url, fields } = jazzcash.buildFormData({
        orderId: order.id,
        amount: order.total_price,
        description: `Wrapify Order #${order.id}`,
        returnUrl: `${PUBLIC_URL}/api/payments/jazzcash/callback`
      });
      return res.json({ provider: 'jazzcash', method: 'POST', url, fields });
    }

    return res.status(400).json({ error: `Unsupported payment method: ${order.payment_method}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/jazzcash/callback', express.urlencoded({ extended: true }), (req, res) => {
  const body = req.body || {};
  const orderId = body.ppmpf_1;
  const responseCode = body.pp_ResponseCode;
  const valid = jazzcash.verifyCallback(body);

  if (!orderId) return res.redirect(`${PUBLIC_URL}/payment/fail?reason=missing_order`);

  if (!valid) {
    db.orders.updateStatus(orderId, 'cancelled');
    return res.redirect(`${PUBLIC_URL}/payment/fail?order=${orderId}&reason=hash_invalid`);
  }

  if (responseCode === '000' || responseCode === '121') {
    db.orders.updateStatus(orderId, 'confirmed');
    return res.redirect(`${PUBLIC_URL}/payment/success?order=${orderId}`);
  }

  db.orders.updateStatus(orderId, 'cancelled');
  return res.redirect(`${PUBLIC_URL}/payment/fail?order=${orderId}&code=${responseCode}`);
});

module.exports = router;
