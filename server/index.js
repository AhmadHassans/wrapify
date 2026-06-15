require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const chatRouter = require('./routes/chat');
const paymentsRouter = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5050;

const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn('[server] uploads dir not writable (read-only filesystem?):', e.message);
}

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',') }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/uploads', express.static(uploadsDir, {
  maxAge: '365d',
  immutable: true,
  setHeaders: (res, filePath) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (/seed_/.test(filePath)) {
      res.set('Cache-Control', 'public, max-age=604800');
    } else {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));
app.use('/api/receipts', express.static(path.join(uploadsDir, 'receipts'), {
  maxAge: '7d',
  setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin')
}));

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payments', paymentsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1d' }));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[err]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] Wrapify API listening on :${PORT}`);
  });
}

module.exports = app;
