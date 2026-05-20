const crypto = require('crypto');

const EP_STORE_ID = process.env.EASYPAISA_STORE_ID || '';
const EP_HASH_KEY = process.env.EASYPAISA_HASH_KEY || '';
const EP_MODE = (process.env.EASYPAISA_MODE || 'sandbox').toLowerCase();

const EP_URL = EP_MODE === 'production'
  ? 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
  : 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf';

const pad = (n) => String(n).padStart(2, '0');

function buildHash(fields, key) {
  const sorted = Object.keys(fields)
    .filter(k => fields[k] !== '' && fields[k] !== undefined && fields[k] !== null && k !== 'merchantHashedReq')
    .sort();
  const data = sorted.map(k => `${k}=${fields[k]}`).join('&');
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
}

function buildFormData({ orderId, amount, returnUrl, email }) {
  if (!EP_STORE_ID || !EP_HASH_KEY) {
    throw new Error('EasyPaisa credentials not configured');
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const orderRef = `EP${now.getTime()}${orderId}`;

  const fields = {
    amount: String(Number(amount).toFixed(1)),
    orderRefNum: orderRef,
    storeId: EP_STORE_ID,
    postBackURL: returnUrl,
    expiryDate: `${pad(expiry.getDate())}${pad(expiry.getMonth() + 1)}${expiry.getFullYear()} ${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`,
    emailAddr: email || '',
    paymentMethod: '',
    autoRedirect: '0'
  };

  fields.merchantHashedReq = buildHash(fields, EP_HASH_KEY);

  return { url: EP_URL, fields, orderRef };
}

function verifyCallback(body) {
  if (!body) return false;
  return !!body.orderRefNum;
}

const isConfigured = () => !!(EP_STORE_ID && EP_HASH_KEY);

module.exports = { buildFormData, verifyCallback, isConfigured, EP_URL };
