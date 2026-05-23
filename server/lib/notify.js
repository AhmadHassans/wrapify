const { sendWhatsApp } = require('./whatsapp');
const { sendEmail } = require('./email');

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://wrapifyoffical.com';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function rupees(n) {
  return `Rs.${Number(n || 0).toLocaleString('en-PK')}`;
}

function itemsLines(items = []) {
  return items.map(it => {
    const size = it.size ? ` [${it.size}]` : '';
    const variant = it.variant ? ` (${it.variant})` : '';
    const qty = it.qty || 1;
    const name = it.name || `Product #${it.id}`;
    return `• ${name}${size}${variant} x${qty}`;
  });
}

function buildWhatsAppText(order) {
  const lines = [
    `🌸 New Wrapify Order #${order.id}`,
    '',
    `Customer: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    '',
    `Payment: ${order.payment_method}`,
    `Total: ${rupees(order.total_price)}`,
    `Status: ${order.status}`,
    ''
  ];

  if (Array.isArray(order.items) && order.items.length) {
    lines.push('Items:');
    lines.push(...itemsLines(order.items));
    lines.push('');
  }

  if (order.packaging) {
    lines.push(`Packaging: ${typeof order.packaging === 'string' ? order.packaging : order.packaging.name || ''}`);
  }

  if (Array.isArray(order.addons) && order.addons.length) {
    lines.push('Add-ons:');
    order.addons.forEach(a => lines.push(`• ${a.name || `Add-on #${a.id}`}`));
  }

  if (order.notes) {
    lines.push('');
    lines.push(`Notes: ${order.notes}`);
  }

  if (order.receipt_image) {
    lines.push('');
    lines.push(`Receipt: ${PUBLIC_URL}/api/receipts/${order.receipt_image}`);
  }

  return lines.join('\n');
}

function buildEmailHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const addons = Array.isArray(order.addons) ? order.addons : [];

  const itemRows = items.map(it => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f5d9e2;">
        ${escapeHtml(it.name || `Product #${it.id}`)}
        ${it.size ? `<span style="color:#888;">[${escapeHtml(it.size)}]</span>` : ''}
        ${it.variant ? `<span style="color:#888;">(${escapeHtml(it.variant)})</span>` : ''}
      </td>
      <td style="padding:6px 12px;border-bottom:1px solid #f5d9e2;text-align:right;">x${it.qty || 1}</td>
    </tr>`).join('');

  const addonRows = addons.map(a => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f5d9e2;">
        ${escapeHtml(a.name || `Add-on #${a.id}`)}
      </td>
      <td style="padding:6px 12px;border-bottom:1px solid #f5d9e2;text-align:right;">x${a.qty || 1}</td>
    </tr>`).join('');

  const receiptBlock = order.receipt_image
    ? `<p><strong>Payment receipt:</strong><br>
         <a href="${PUBLIC_URL}/api/receipts/${escapeHtml(order.receipt_image)}" target="_blank">
           View receipt image
         </a>
       </p>`
    : `<p><em>Payment receipt: not uploaded yet</em></p>`;

  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#3a2438;">
    <h2 style="color:#c73e6f;margin-bottom:4px;">🌸 New Wrapify Order #${order.id}</h2>
    <p style="color:#888;margin-top:0;">Status: ${escapeHtml(order.status)}</p>

    <h3 style="border-bottom:2px solid #f5d9e2;padding-bottom:4px;">Customer</h3>
    <p>
      <strong>Name:</strong> ${escapeHtml(order.customer_name)}<br>
      <strong>Phone:</strong> ${escapeHtml(order.phone)}<br>
      <strong>Address:</strong> ${escapeHtml(order.address)}
    </p>

    <h3 style="border-bottom:2px solid #f5d9e2;padding-bottom:4px;">Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemRows || '<tr><td style="padding:6px 12px;">No items</td></tr>'}
    </table>

    ${order.packaging ? `<p><strong>Packaging:</strong> ${escapeHtml(typeof order.packaging === 'string' ? order.packaging : order.packaging.name || '')}</p>` : ''}

    ${addons.length ? `
      <h3 style="border-bottom:2px solid #f5d9e2;padding-bottom:4px;">Add-ons</h3>
      <table style="width:100%;border-collapse:collapse;">${addonRows}</table>
    ` : ''}

    ${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ''}

    <h3 style="border-bottom:2px solid #f5d9e2;padding-bottom:4px;">Payment</h3>
    <p>
      <strong>Method:</strong> ${escapeHtml(order.payment_method)}<br>
      ${order.sender_details ? `<strong>Sender:</strong> ${escapeHtml(order.sender_details)}<br>` : ''}
      ${order.trx_id ? `<strong>TRX ID:</strong> ${escapeHtml(order.trx_id)}<br>` : ''}
      <strong>Total:</strong> <span style="color:#c73e6f;font-size:18px;">${rupees(order.total_price)}</span>
    </p>

    ${receiptBlock}

    <hr style="border:none;border-top:1px solid #f5d9e2;margin:24px 0;">
    <p style="color:#888;font-size:12px;">Sent automatically from Wrapify server.</p>
  </div>`;
}

function buildEmailText(order) {
  return buildWhatsAppText(order);
}

async function newOrder(order) {
  const text = buildWhatsAppText(order);
  const html = buildEmailHtml(order);

  Promise.allSettled([
    sendWhatsApp(text),
    sendEmail({
      subject: `🌸 New Order #${order.id} — ${rupees(order.total_price)}`,
      html,
      text
    })
  ]).then(results => {
    results.forEach((r, i) => {
      const channel = i === 0 ? 'whatsapp' : 'email';
      if (r.status === 'fulfilled') {
        console.log(`[notify] ${channel} result`, r.value);
      } else {
        console.error(`[notify] ${channel} rejected`, r.reason);
      }
    });
  });
}

async function paymentProof(order) {
  const text = `💌 Payment proof submitted for Order #${order.id}\n\n${buildWhatsAppText(order)}`;
  const html = buildEmailHtml(order);

  Promise.allSettled([
    sendWhatsApp(text),
    sendEmail({
      subject: `💌 Payment received — Order #${order.id}`,
      html,
      text
    })
  ]).then(results => {
    results.forEach((r, i) => {
      const channel = i === 0 ? 'whatsapp' : 'email';
      if (r.status === 'fulfilled') {
        console.log(`[notify] ${channel} (proof) result`, r.value);
      } else {
        console.error(`[notify] ${channel} (proof) rejected`, r.reason);
      }
    });
  });
}

module.exports = { newOrder, paymentProof };
