#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'wrapify.json');

const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;
const QUALITY = 82;

const DRY_RUN = process.argv.includes('--dry');

async function convertOne(filename) {
  const srcPath = path.join(UPLOADS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);
  const outName = `${base}.webp`;
  const thumbName = `${base}_thumb.webp`;
  const outPath = path.join(UPLOADS_DIR, outName);
  const thumbPath = path.join(UPLOADS_DIR, thumbName);

  if (fs.existsSync(outPath) && fs.existsSync(thumbPath)) {
    return { skipped: true, reason: 'already-converted' };
  }
  if (ext === '.svg') return { skipped: true, reason: 'svg' };
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return { skipped: true, reason: 'unsupported-ext' };
  }
  if (filename.endsWith('_thumb.webp')) return { skipped: true, reason: 'thumb' };

  if (DRY_RUN) return { dryRun: true, would: { outName, thumbName } };

  try {
    const meta = await sharp(srcPath).metadata();
    if (!fs.existsSync(outPath)) {
      await sharp(srcPath)
        .rotate()
        .resize({ width: Math.min(MAX_WIDTH, meta.width || MAX_WIDTH), withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);
    }
    if (!fs.existsSync(thumbPath)) {
      await sharp(srcPath)
        .rotate()
        .resize({ width: Math.min(THUMB_WIDTH, meta.width || THUMB_WIDTH), withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(thumbPath);
    }
    return { converted: true, outName, thumbName };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log(DRY_RUN ? '🧪 DRY RUN — no files will be written\n' : '🌸 Converting old upload images to WebP + thumbnails\n');

  const files = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const p = path.join(UPLOADS_DIR, f);
    return fs.statSync(p).isFile();
  });

  const referenced = new Set();
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    for (const p of db.products || []) {
      (p.images || []).forEach(n => referenced.add(n));
      (p.variants || []).forEach(v => v.image && referenced.add(v.image));
    }
    console.log(`📌 ${referenced.size} images referenced in wrapify.json (untouched)\n`);
  } catch {
    console.log('📌 Could not read wrapify.json — proceeding without reference check\n');
  }

  let ok = 0, skip = 0, err = 0;
  for (const f of files) {
    const r = await convertOne(f);
    if (r.converted) { console.log(`✅ ${f} → ${r.outName} + ${r.thumbName}`); ok++; }
    else if (r.dryRun) { console.log(`📝 would convert ${f} → ${r.would.outName} + ${r.would.thumbName}`); ok++; }
    else if (r.skipped) { skip++; }
    else if (r.error) { console.log(`❌ ${f}: ${r.error}`); err++; }
  }

  console.log(`\n✨ Done. converted=${ok} skipped=${skip} errors=${err}`);
  console.log('Note: original files were NOT deleted. wrapify.json was NOT modified.');
  console.log('To use new WebP versions, frontend will request them automatically once filenames in DB are updated via admin re-upload.');
})();
