const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;
const QUALITY = 82;

async function processOne(filename) {
  const srcPath = path.join(UPLOADS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.svg') return filename;

  const base = path.basename(filename, ext);
  const outName = `${base}.webp`;
  const thumbName = `${base}_thumb.webp`;
  const outPath = path.join(UPLOADS_DIR, outName);
  const thumbPath = path.join(UPLOADS_DIR, thumbName);

  try {
    const meta = await sharp(srcPath).metadata();

    await sharp(srcPath)
      .rotate()
      .resize({ width: Math.min(MAX_WIDTH, meta.width || MAX_WIDTH), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    await sharp(srcPath)
      .rotate()
      .resize({ width: Math.min(THUMB_WIDTH, meta.width || THUMB_WIDTH), withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(thumbPath);

    if (outName !== filename) {
      try { fs.unlinkSync(srcPath); } catch {}
    }
    return outName;
  } catch (e) {
    console.error('[imagePipeline] failed for', filename, e.message);
    return filename;
  }
}

async function processFiles(files) {
  return Promise.all(files.map(async (f) => {
    const newName = await processOne(f.filename);
    f.filename = newName;
    return f;
  }));
}

module.exports = { processOne, processFiles, UPLOADS_DIR };
