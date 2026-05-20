const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'wrapify.json');

const initial = {
  products: [],
  orders: [],
  nextProductId: 1,
  nextOrderId: 1
};

let state;
try {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  state = JSON.parse(raw);
  state.products ||= [];
  state.orders ||= [];
  state.nextProductId ||= 1;
  state.nextOrderId ||= 1;
} catch {
  state = JSON.parse(JSON.stringify(initial));
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setImmediate(() => {
    saveTimer = null;
    try {
      const tmp = DB_PATH + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(state));
      fs.renameSync(tmp, DB_PATH);
    } catch (e) {
      console.error('[db] save failed:', e.message);
    }
  });
}

function saveSync() {
  try {
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, DB_PATH);
  } catch (e) {
    console.error('[db] saveSync failed:', e.message);
  }
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function seedIfEmpty() {
  if (state.products.length > 0) return;

  const seed = [
    {
      name: 'Lotus Body Lotion',
      description: 'Soothing rose-scented body lotion for soft skin.',
      price: 350,
      label: 'Budget Friendly',
      packaging_type: '',
      is_addon: 0,
      images: ['seed_lotion_1.svg', 'seed_lotion_2.svg'],
      variants: [
        { color: 'Pink', price_add: 0, image: 'seed_lotion_1.svg' },
        { color: 'White', price_add: 0, image: 'seed_lotion_2.svg' }
      ],
      deals: ''
    },
    {
      name: 'Fancy Scrunchie Set',
      description: 'Set of 5 silky scrunchies in pastel tones.',
      price: 199,
      label: 'Budget Friendly',
      packaging_type: '',
      is_addon: 0,
      images: ['seed_scrunchie.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Rose Bath Bomb Set',
      description: 'Handmade rose-scented bath bombs.',
      price: 450,
      label: 'Premium',
      packaging_type: '',
      is_addon: 0,
      images: ['seed_bathbomb.svg'],
      variants: [],
      deals: 'Buy 2 Get 1 Free'
    },
    {
      name: 'Mini Perfume Oil',
      description: 'Long-lasting attar in delicate floral notes.',
      price: 599,
      label: 'Premium',
      packaging_type: '',
      is_addon: 0,
      images: ['seed_perfume.svg'],
      variants: [
        { color: 'Rose', price_add: 0, image: 'seed_perfume.svg' },
        { color: 'Oud', price_add: 50, image: 'seed_perfume.svg' },
        { color: 'Vanilla', price_add: 0, image: 'seed_perfume.svg' }
      ],
      deals: ''
    },
    {
      name: 'Chocolate Box (Ferrero)',
      description: 'Premium Ferrero Rocher gift box.',
      price: 799,
      label: 'Premium',
      packaging_type: '',
      is_addon: 0,
      images: ['seed_chocolate.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Eid Card',
      description: 'Cute handcrafted Eid greeting card.',
      price: 50,
      label: '',
      packaging_type: '',
      is_addon: 1,
      images: ['seed_card.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Handwritten Note',
      description: 'Personal handwritten note from you.',
      price: 30,
      label: '',
      packaging_type: '',
      is_addon: 1,
      images: ['seed_note.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Basket Packaging',
      description: 'Cane basket with ribbon and filler.',
      price: 200,
      label: '',
      packaging_type: 'basket',
      is_addon: 0,
      images: ['seed_basket.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Gift Box Packaging',
      description: 'Elegant gift box with ribbon.',
      price: 250,
      label: '',
      packaging_type: 'gift_box',
      is_addon: 0,
      images: ['seed_giftbox.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Transparent Box Packaging',
      description: 'Clear acrylic box, perfect display.',
      price: 220,
      label: '',
      packaging_type: 'transparent',
      is_addon: 0,
      images: ['seed_transparent.svg'],
      variants: [],
      deals: ''
    },
    {
      name: 'Net Wrapping',
      description: 'Soft net wrap with ribbon tie.',
      price: 150,
      label: '',
      packaging_type: 'net',
      is_addon: 0,
      images: ['seed_net.svg'],
      variants: [],
      deals: ''
    }
  ];

  for (const p of seed) {
    state.products.push({
      id: state.nextProductId++,
      ...p,
      is_active: 1,
      created_at: nowStamp()
    });
  }
  saveSync();
  console.log('[db] Seeded', seed.length, 'products');
}

seedIfEmpty();

const products = {
  all() {
    return [...state.products].sort((a, b) => b.id - a.id);
  },
  active() {
    return [...state.products].filter(p => p.is_active).sort((a, b) => b.id - a.id);
  },
  get(id) {
    const n = Number(id);
    return state.products.find(p => p.id === n) || null;
  },
  insert(obj) {
    const row = {
      id: state.nextProductId++,
      name: obj.name,
      description: obj.description || '',
      price: Number(obj.price) || 0,
      label: obj.label || '',
      packaging_type: obj.packaging_type || '',
      is_addon: obj.is_addon ? 1 : 0,
      images: Array.isArray(obj.images) ? obj.images : [],
      variants: Array.isArray(obj.variants) ? obj.variants : [],
      deals: obj.deals || '',
      is_active: obj.is_active === 0 ? 0 : 1,
      created_at: nowStamp()
    };
    state.products.push(row);
    save();
    return row;
  },
  update(id, patch) {
    const n = Number(id);
    const idx = state.products.findIndex(p => p.id === n);
    if (idx === -1) return null;
    state.products[idx] = { ...state.products[idx], ...patch, id: n };
    save();
    return state.products[idx];
  },
  delete(id) {
    const n = Number(id);
    const idx = state.products.findIndex(p => p.id === n);
    if (idx === -1) return null;
    const removed = state.products.splice(idx, 1)[0];
    save();
    return removed;
  }
};

const orders = {
  all() {
    return [...state.orders].sort((a, b) => b.id - a.id);
  },
  get(id) {
    const n = Number(id);
    return state.orders.find(o => o.id === n) || null;
  },
  insert(obj) {
    const row = {
      id: state.nextOrderId++,
      customer_name: obj.customer_name,
      address: obj.address,
      phone: obj.phone,
      payment_method: obj.payment_method,
      items: Array.isArray(obj.items) ? obj.items : [],
      packaging: obj.packaging || '',
      addons: Array.isArray(obj.addons) ? obj.addons : [],
      notes: obj.notes || '',
      budget: obj.budget || '',
      total_price: Number(obj.total_price) || 0,
      status: obj.status || 'pending',
      sender_details: obj.sender_details || '',
      trx_id: obj.trx_id || '',
      receipt_image: obj.receipt_image || '',
      created_at: nowStamp()
    };
    state.orders.push(row);
    save();
    return row;
  },
  updatePayment(id, patch) {
    const n = Number(id);
    const idx = state.orders.findIndex(o => o.id === n);
    if (idx === -1) return null;
    state.orders[idx] = { ...state.orders[idx], ...patch };
    save();
    return state.orders[idx];
  },
  updateStatus(id, status) {
    const n = Number(id);
    const idx = state.orders.findIndex(o => o.id === n);
    if (idx === -1) return null;
    state.orders[idx].status = status;
    save();
    return state.orders[idx];
  }
};

module.exports = { products, orders, _state: state, _save: save };
