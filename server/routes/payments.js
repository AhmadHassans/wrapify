const express = require('express');
const db = require('../db');
const jazzcash = require('../lib/jazzcash');
const easypaisa = require('../lib/easypaisa');

const router = express.Router();

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://wrapifyoffical.com';

router.get('/status', (req, res) => {
  res.json({
    jazzcash: jazzcash.isConfigured(),
    easypaisa: easypaisa.isConfigured(),
    publicUrl: PUBLIC_URL
  });
});

router.get('/accounts', (req, res) => {
  res.json({
    jazzcash: {
      title: process.env.ACCOUNT_JAZZCASH_NAME || 'Wrapify',
      number: process.env.ACCOUNT_JAZZCASH_NUMBER || '03XX-XXXXXXX',
      instructions: 'Send the exact total amount to this JazzCash mobile account. After paying, enter the TRX ID and upload screenshot.'
    },
    easypaisa: {
      title: process.env.ACCOUNT_EASYPAISA_NAME || 'Wrapify',
      number: process.env.ACCOUNT_EASYPAISA_NUMBER || '03XX-XXXXXXX',
      instructions: 'Send the exact total amount to this EasyPaisa mobile account. After paying, enter the TRX ID and upload screenshot.'
    },
    bank: {
      title: process.env.ACCOUNT_BANK_TITLE || 'Wrapify',
      bank: process.env.ACCOUNT_BANK_NAME || 'Meezan Bank',
      iban: process.env.ACCOUNT_BANK_IBAN || 'PK00MEZN0000000000000000',
      account: process.env.ACCOUNT_BANK_NUMBER || '00000000000000',
      instructions: 'Transfer the exact total amount to this bank account. After transfer, enter the reference and upload receipt.'
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
        return res.status(503).json({ error: 'JazzCash not configured yet. Use COD or contact support.' });
      }
      const { url, fields } = jazzcash.buildFormData({
        orderId: order.id,
        amount: order.total_price,
        description: `Wrapify Order #${order.id}`,
        returnUrl: `${PUBLIC_URL}/api/payments/jazzcash/callback`
      });
      return res.json({ provider: 'jazzcash', method: 'POST', url, fields });
    }

    if (method === 'easypaisa') {
      if (!easypaisa.isConfigured()) {
        return res.status(503).json({ error: 'EasyPaisa not configured yet. Use COD or contact support.' });
      }
      const { url, fields } = easypaisa.buildFormData({
        orderId: order.id,
        amount: order.total_price,
        returnUrl: `${PUBLIC_URL}/api/payments/easypaisa/callback`,
        email: ''
      });
      return res.json({ provider: 'easypaisa', method: 'POST', url, fields });
    }

    res.json({ provider: 'cod', method: null });
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

router.post('/easypaisa/callback', express.urlencoded({ extended: true }), (req, res) => {
  const body = req.body || {};
  const orderRef = body.orderRefNum || '';
  const orderId = orderRef.replace(/^EP\d+/, '').replace(/[^\d]/g, '') || null;
  const status = (body.status || '').toUpperCase();

  if (!orderId) return res.redirect(`${PUBLIC_URL}/payment/fail?reason=missing_order`);

  if (status === 'SUCCESS' || status === '0000') {
    db.orders.updateStatus(orderId, 'confirmed');
    return res.redirect(`${PUBLIC_URL}/payment/success?order=${orderId}`);
  }

  db.orders.updateStatus(orderId, 'cancelled');
  return res.redirect(`${PUBLIC_URL}/payment/fail?order=${orderId}&status=${status}`);
});

router.get('/easypaisa/callback', (req, res) => {
  const orderRef = req.query.orderRefNum || '';
  const orderId = orderRef.replace(/^EP\d+/, '').replace(/[^\d]/g, '') || null;
  if (orderId) db.orders.updateStatus(orderId, 'confirmed');
  res.redirect(`${PUBLIC_URL}/payment/success?order=${orderId || ''}`);
});

module.exports = router;
