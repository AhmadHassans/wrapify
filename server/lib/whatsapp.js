const OWNER_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || '923236313345';
const API_KEY = process.env.CALLMEBOT_API_KEY || '';

async function sendWhatsApp(text) {
  if (!API_KEY) {
    console.warn('[wa] CALLMEBOT_API_KEY not set — skipping WhatsApp notification');
    return { ok: false, reason: 'no_key' };
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${OWNER_NUMBER}&text=${encodeURIComponent(text)}&apikey=${API_KEY}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    const body = await res.text();
    if (!res.ok) {
      console.error('[wa] send failed', res.status, body.slice(0, 200));
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    console.error('[wa] send error', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { sendWhatsApp };
