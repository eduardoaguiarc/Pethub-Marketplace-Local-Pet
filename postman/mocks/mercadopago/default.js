// Contract-derived Mercado Pago stand-in. Local test data only.
const http = require('http');
http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname;
  const body = req.body || {};
  const state = await pm.state.get('mercadopago.state') || { payments: {}, keys: {}, requests: [], failCreateAfterWrite: false, failRefund: false, pixPending: false };
  const send = async (status, data) => {
    await pm.state.set('mercadopago.state', state);
    res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
  };
  if (route === '/__reset' && req.method === 'POST') { await pm.state.set('mercadopago.state', null); res.writeHead(204); return res.end(); }
  if (route === '/__control' && req.method === 'POST') { Object.assign(state, body); return send(200, { ok: true }); }
  if (route === '/__state') return send(200, state);
  const approve = route.match(/^\/__approve\/([^/]+)$/);
  if (approve) { const p = state.payments[approve[1]]; if (!p) return send(404, { error: 'not_found' }); p.status = 'approved'; return send(200, p); }
  // Deliberately omit card tokens and authorization headers from stored logs.
  state.requests.push({ method: req.method, path: route, key: req.headers['x-idempotency-key'], amount: body.transaction_amount, fee: body.application_fee, capture: body.capture });
  if (route === '/oauth/token' && req.method === 'POST') return send(200, { access_token: 'simulation-seller-token', refresh_token: 'simulation-refresh-token', expires_in: 21600, user_id: '12345', public_key: 'TEST-simulation-public-key' });
  if (!req.headers.authorization?.startsWith('Bearer ')) return send(401, { error: 'unauthorized' });
  const key = req.headers['x-idempotency-key'];
  if (req.method !== 'GET' && !key) return send(400, { error: 'missing_idempotency_key' });
  if (route === '/v1/payments' && req.method === 'POST') {
    if (state.keys[key]) return send(201, state.payments[state.keys[key]]);
    if (!(body.transaction_amount > 0) || Math.abs(body.application_fee - Math.round(body.transaction_amount * 10) / 100) > 0.01001 || !body.external_reference || !body.payer?.email) return send(400, { error: 'invalid_payment' });
    const id = String(Date.now()) + String(require('crypto').randomInt(1000000)).padStart(6, '0');
    const status = body.payment_method_id === 'pix' ? (state.pixPending ? 'pending' : 'approved') : (body.capture === false ? 'authorized' : 'approved');
    const p = { id, status, transaction_amount: body.transaction_amount, application_fee: body.application_fee, transaction_amount_refunded: 0, external_reference: body.external_reference, money_release_date: '2026-11-15T12:00:00.000-03:00', point_of_interaction: { transaction_data: { qr_code: 'SIMULATED-NOT-A-REAL-PIX', qr_code_base64: '' } } };
    state.payments[id] = p; state.keys[key] = id;
    if (state.failCreateAfterWrite) { state.failCreateAfterWrite = false; return send(503, { error: 'simulated_response_lost_after_write' }); }
    return send(201, p);
  }
  const match = route.match(/^\/v1\/payments\/([^/]+)(\/refunds)?$/);
  if (match) {
    const p = state.payments[match[1]]; if (!p) return send(404, { error: 'Payment-not-found' });
    if (req.method === 'GET' && !match[2]) return send(200, p);
    if (req.method === 'PUT' && !match[2]) {
      if (body.capture === true) { if (!['authorized', 'approved'].includes(p.status)) return send(400, { error: 'invalid_status' }); p.status = 'approved'; }
      if (body.status === 'cancelled') { if (p.status === 'approved') return send(400, { error: 'must_refund' }); p.status = 'cancelled'; }
      return send(200, p);
    }
    if (req.method === 'POST' && match[2]) {
      if (state.failRefund) { state.failRefund = false; return send(503, { error: 'simulated_refund_failure' }); }
      if (state.keys[key]) return send(201, state.keys[key]);
      const amount = body.amount ?? p.transaction_amount;
      if (!(amount > 0) || amount + p.transaction_amount_refunded > p.transaction_amount) return send(400, { error: 'invalid_refund_amount' });
      p.transaction_amount_refunded = Math.round((p.transaction_amount_refunded + amount) * 100) / 100;
      if (p.transaction_amount_refunded === p.transaction_amount) p.status = 'refunded';
      const refund = { id: 'refund-' + key, payment_id: p.id, amount, status: 'approved' }; state.keys[key] = refund;
      return send(201, refund);
    }
  }
  return send(501, { error: 'Unmodeled endpoint' });
}).listen(process.env.PORT || 4500);
