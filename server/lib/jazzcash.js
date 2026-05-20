const crypto = require('crypto');

const JC_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '';
const JC_PASSWORD = process.env.JAZZCASH_PASSWORD || '';
const JC_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT || '';
const JC_MODE = (process.env.JAZZCASH_MODE || 'sandbox').toLowerCase();

const JC_URL = JC_MODE === 'production'
  ? 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
  : 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

function buildSecureHash(fields, salt) {
  const sorted = Object.keys(fields)
    .filter(k => fields[k] !== '' && fields[k] !== undefined && fields[k] !== null)
    .sort();
  const values = sorted.map(k => fields[k]).join('&');
  const data = `${salt}&${values}`;
  return crypto
    .createHmac('sha256', salt)
    .update(data)
    .digest('hex')
    .toUpperCase();
}

function buildFormData({ orderId, amount, description, returnUrl }) {
  if (!JC_MERCHANT_ID || !JC_PASSWORD || !JC_INTEGRITY_SALT) {
    throw new Error('JazzCash credentials not configured');
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);
  const txnRef = `T${fmtDate(now)}${String(orderId).padStart(4, '0')}`;
  const amountPaisas = Math.round(Number(amount) * 100);

  const fields = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: JC_MERCHANT_ID,
    pp_SubMerchantID: '',
    pp_Password: JC_PASSWORD,
    pp_BankID: 'TBANK',
    pp_ProductID: 'RETL',
    pp_TxnRefNo: txnRef,
    pp_Amount: String(amountPaisas),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: fmtDate(now),
    pp_BillReference: `order-${orderId}`,
    pp_Description: description || 'Wrapify Eid hamper',
    pp_TxnExpiryDateTime: fmtDate(expiry),
    pp_ReturnURL: returnUrl,
    ppmpf_1: String(orderId),
    ppmpf_2: '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: ''
  };

  fields.pp_SecureHash = buildSecureHash(fields, JC_INTEGRITY_SALT);

  return { url: JC_URL, fields, txnRef };
}

function verifyCallback(body) {
  if (!body || !body.pp_SecureHash) return false;
  const received = body.pp_SecureHash;
  const rest = { ...body };
  delete rest.pp_SecureHash;
  const computed = buildSecureHash(rest, JC_INTEGRITY_SALT);
  return computed === received;
}

const isConfigured = () => !!(JC_MERCHANT_ID && JC_PASSWORD && JC_INTEGRITY_SALT);

module.exports = { buildFormData, verifyCallback, isConfigured, JC_URL };
