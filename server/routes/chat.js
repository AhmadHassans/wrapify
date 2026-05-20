const express = require('express');
const db = require('../db');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const USE_GEMINI = !!GEMINI_API_KEY;
const USE_GROQ = !USE_GEMINI && !!GROQ_API_KEY;

const buildCatalog = () => {
  const rows = db.products.active();
  return rows.map(r => {
    const variants = Array.isArray(r.variants) ? r.variants : [];
    const variantText = variants.length
      ? ` Variants: ${variants.map(v => `${v.color}${v.price_add ? ` (+Rs.${v.price_add})` : ''}`).join(', ')}.`
      : '';
    const tags = [];
    if (r.is_addon) tags.push('add-on');
    if (r.packaging_type) tags.push(`packaging:${r.packaging_type}`);
    if (r.label) tags.push(r.label);
    if (r.deals) tags.push(`deal:${r.deals}`);
    const tagText = tags.length ? ` [${tags.join(', ')}]` : '';
    return `- ${r.name} — Rs.${r.price}${tagText}.${variantText} ${r.description || ''}`.trim();
  }).join('\n');
};

const systemPrompt = (catalog) => `You are Wrapify Assistant — a friendly chatbot for Wrapify, a Gen-Z Eid hamper gifting store in Pakistan.

Your job:
1. Help customers pick items for their budget
2. Suggest combinations that fit their budget
3. Describe what the final hamper will look like (colors, vibe, items)
4. Answer questions about products, prices, packaging, add-ons

Tone: warm, cute, casual. Use light emojis (💖🎁✨🛍️). Mix English + Roman Urdu if customer does. Keep replies short (2-5 sentences) unless detailed list requested.

CURRENT INVENTORY (live from database — only suggest items from this list):
${catalog}

Rules:
- NEVER invent products or prices not in the list above
- All prices in Pakistani Rupees (Rs.)
- When suggesting a hamper, list items with prices and total
- Mention packaging (basket/gift box/transparent/net) as separate optional charge
- If budget tight, prefer "Budget Friendly" labeled items
- For premium budget, lean into "Premium" items
- If a deal exists (e.g. Buy 2 Get 1 Free), mention it
- End with a tiny call-to-action like "Want me to add these to your hamper? 💌"`;

router.get('/health', async (req, res) => {
  if (USE_GEMINI) {
    return res.json({ ok: true, provider: 'gemini', model: GEMINI_MODEL });
  }
  if (USE_GROQ) {
    return res.json({ ok: true, provider: 'groq', model: GROQ_MODEL });
  }
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) throw new Error('bad response');
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    const hasModel = models.some(m => m === OLLAMA_MODEL || m.startsWith(OLLAMA_MODEL.split(':')[0]));
    res.json({ ok: true, provider: 'ollama', model: OLLAMA_MODEL, hasModel, availableModels: models });
  } catch (e) {
    res.json({ ok: false, provider: 'ollama', error: e.message, hint: `Set GEMINI_API_KEY or GROQ_API_KEY in .env, or install Ollama locally` });
  }
});

router.post('/', async (req, res) => {
  const { messages = [] } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const catalog = buildCatalog();
  const sys = systemPrompt(catalog);

  const chatMessages = [
    { role: 'system', content: sys },
    ...messages.filter(m => m.role && m.content).slice(-20)
  ];

  if (USE_GEMINI) {
    try {
      const r = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(502).json({ error: 'Gemini error', detail: errText });
      }
      const data = await r.json();
      const reply = data.choices?.[0]?.message?.content || '';
      return res.json({ reply, provider: 'gemini', model: GEMINI_MODEL });
    } catch (e) {
      return res.status(502).json({ error: 'Gemini request failed', detail: e.message });
    }
  }

  if (USE_GROQ) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(502).json({ error: 'Groq error', detail: errText });
      }
      const data = await r.json();
      const reply = data.choices?.[0]?.message?.content || '';
      return res.json({ reply, provider: 'groq', model: GROQ_MODEL });
    } catch (e) {
      return res.status(502).json({ error: 'Groq request failed', detail: e.message });
    }
  }

  try {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: chatMessages,
        stream: false,
        options: { temperature: 0.7, num_ctx: 4096 }
      }),
      signal: AbortSignal.timeout(60000)
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: 'Ollama error', detail: errText });
    }
    const data = await r.json();
    const reply = data.message?.content || '';
    res.json({ reply, provider: 'ollama', model: OLLAMA_MODEL });
  } catch (e) {
    res.status(502).json({
      error: 'Cannot reach Ollama',
      hint: `Set GROQ_API_KEY in .env for free cloud bot, or install Ollama locally`,
      detail: e.message
    });
  }
});

module.exports = router;
