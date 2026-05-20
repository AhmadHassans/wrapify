const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const svgFor = (label, colorA, colorB, emoji) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <text x="50%" y="48%" text-anchor="middle" font-family="serif" font-size="180">${emoji}</text>
  <text x="50%" y="78%" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="32" fill="#5b3a4a" font-weight="600">${label}</text>
</svg>`;

const items = [
  ['seed_lotion_1.svg',     'Lotion (Pink)',   '#ffd6e0', '#ffb6c1', '🧴'],
  ['seed_lotion_2.svg',     'Lotion (White)',  '#fff5f7', '#ffe4ec', '🧴'],
  ['seed_scrunchie.svg',    'Scrunchies',      '#fce4ec', '#f8bbd0', '🎀'],
  ['seed_bathbomb.svg',     'Bath Bombs',      '#fbe4ff', '#e6c4f7', '🛁'],
  ['seed_perfume.svg',      'Perfume Oil',     '#fff0f5', '#ffd1dc', '🌸'],
  ['seed_chocolate.svg',    'Chocolate Box',   '#fde2d2', '#e8b08e', '🍫'],
  ['seed_card.svg',         'Eid Card',        '#fff5f5', '#ffdede', '💌'],
  ['seed_note.svg',         'Handwritten Note','#fffaf0', '#ffe7b5', '✍️'],
  ['seed_basket.svg',       'Basket',          '#fff1e6', '#f5cba7', '🧺'],
  ['seed_giftbox.svg',      'Gift Box',        '#ffe4ec', '#ffb3c6', '🎁'],
  ['seed_transparent.svg',  'Clear Box',       '#eaf6fb', '#cfe7f1', '📦'],
  ['seed_net.svg',          'Net Wrap',        '#f3eaff', '#dcc4ff', '🎀']
];

for (const [file, label, a, b, emoji] of items) {
  const p = path.join(uploadsDir, file);
  fs.writeFileSync(p, svgFor(label, a, b, emoji));
}
console.log('[seed-images] Wrote', items.length, 'SVGs to', uploadsDir);
