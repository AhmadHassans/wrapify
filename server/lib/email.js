const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.RESEND_FROM || 'Wrapify Orders <onboarding@resend.dev>';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'officalwrapify@gmail.com';

async function sendEmail({ subject, html, text }) {
  if (!RESEND_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email notification');
    return { ok: false, reason: 'no_key' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [OWNER_EMAIL],
        subject,
        html,
        text
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[email] send failed', res.status, data);
      return { ok: false, status: res.status, error: data };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    console.error('[email] send error', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { sendEmail };
