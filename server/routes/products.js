const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const db = require('../db');
const { processFiles } = require('../imagePipeline');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safe);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  if (!ok) return cb(new Error('Only jpeg/png/webp images allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 12 }
});

const parseJSON = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

const formatProduct = (p) => ({
  ...p,
  is_addon: !!p.is_addon,
  is_ready_hamper: !!p.is_ready_hamper,
  is_active: !!p.is_active,
  images: Array.isArray(p.images) ? p.images : [],
  variants: Array.isArray(p.variants) ? p.variants : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : []
});

router.get('/', (req, res) => {
  const list = req.query.all === '1' ? db.products.all() : db.products.active();
  res.json(list.map(formatProduct));
});

router.get('/:id', (req, res) => {
  const p = db.products.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(formatProduct(p));
});

const parseVariantsField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch { return []; }
};

const parseSizesField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.map(s => ({ name: String(s.name || ''), price: Number(s.price) || 0 })).filter(s => s.name);
  } catch { return []; }
};

router.post('/', upload.any(), async (req, res) => {
  const {
    name, description = '', price = 0,
    label = '', packaging_type = '',
    is_addon = '0', is_ready_hamper = '0',
    deals = '', is_active = '1'
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name required' });

  await processFiles(req.files || []);
  const allFiles = req.files || [];
  const imageFiles = allFiles.filter(f => f.fieldname === 'images').map(f => f.filename);
  let images = imageFiles;
  if (req.body.existing_images) {
    const existing = parseJSON(req.body.existing_images, []);
    images = [...existing, ...imageFiles];
  }

  const variants = parseVariantsField(req.body.variants);
  const variantFileMap = {};
  allFiles.forEach(f => {
    if (f.fieldname && f.fieldname.startsWith('variant_image_')) {
      variantFileMap[f.fieldname] = f.filename;
    }
  });
  variants.forEach((v, i) => {
    const key = `variant_image_${i}`;
    if (variantFileMap[key]) v.image = variantFileMap[key];
  });

  const sizes = parseSizesField(req.body.sizes);

  const row = db.products.insert({
    name,
    description,
    price: Number(price) || 0,
    label,
    packaging_type,
    is_addon: is_addon === '1' || is_addon === 1 || is_addon === true ? 1 : 0,
    is_ready_hamper: is_ready_hamper === '1' || is_ready_hamper === 1 || is_ready_hamper === true ? 1 : 0,
    images,
    variants,
    sizes,
    deals,
    is_active: is_active === '0' || is_active === 0 ? 0 : 1
  });

  res.status(201).json(formatProduct(row));
});

router.put('/:id', upload.any(), async (req, res) => {
  const existing = db.products.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const body = req.body;
  await processFiles(req.files || []);
  const allFiles = req.files || [];
  const imageFiles = allFiles.filter(f => f.fieldname === 'images').map(f => f.filename);
  let images = Array.isArray(existing.images) ? existing.images : [];
  if (body.existing_images !== undefined) {
    images = parseJSON(body.existing_images, []);
  }
  images = [...images, ...imageFiles];

  let variants;
  if (body.variants !== undefined) {
    variants = parseVariantsField(body.variants);
  } else {
    variants = Array.isArray(existing.variants) ? existing.variants : [];
  }
  const variantFileMap = {};
  allFiles.forEach(f => {
    if (f.fieldname && f.fieldname.startsWith('variant_image_')) {
      variantFileMap[f.fieldname] = f.filename;
    }
  });
  variants.forEach((v, i) => {
    const key = `variant_image_${i}`;
    if (variantFileMap[key]) v.image = variantFileMap[key];
  });

  const sizes = body.sizes !== undefined
    ? parseSizesField(body.sizes)
    : (Array.isArray(existing.sizes) ? existing.sizes : []);

  const patch = {
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    price: body.price !== undefined ? Number(body.price) : existing.price,
    label: body.label ?? existing.label,
    packaging_type: body.packaging_type ?? existing.packaging_type,
    is_addon: body.is_addon !== undefined
      ? (body.is_addon === '1' || body.is_addon === 1 || body.is_addon === true ? 1 : 0)
      : existing.is_addon,
    is_ready_hamper: body.is_ready_hamper !== undefined
      ? (body.is_ready_hamper === '1' || body.is_ready_hamper === 1 || body.is_ready_hamper === true ? 1 : 0)
      : (existing.is_ready_hamper || 0),
    images,
    variants,
    sizes,
    deals: body.deals ?? existing.deals,
    is_active: body.is_active !== undefined
      ? (body.is_active === '0' || body.is_active === 0 ? 0 : 1)
      : existing.is_active
  };

  const updated = db.products.update(existing.id, patch);
  res.json(formatProduct(updated));
});

router.delete('/:id', (req, res) => {
  const removed = db.products.delete(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  const images = Array.isArray(removed.images) ? removed.images : [];
  images.forEach(name => {
    if (!name || name.startsWith('seed_')) return;
    const p = path.join(__dirname, '..', 'uploads', name);
    fs.unlink(p, () => {});
  });
  res.json({ success: true });
});

router.post('/:id/images', upload.array('images', 12), async (req, res) => {
  const existing = db.products.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await processFiles(req.files || []);
  const added = (req.files || []).map(f => f.filename);
  const all = [...(Array.isArray(existing.images) ? existing.images : []), ...added];
  const updated = db.products.update(existing.id, { images: all });
  res.json({ images: updated.images });
});

module.exports = router;
