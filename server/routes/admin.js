const express = require('express');
const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wrapify2024';

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false, error: 'Wrong password' });
});

module.exports = router;
