const API_BASE = '/api';

export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Không thể tải phiên đặt hàng');
  return res.json();
}

export async function fetchSessions(adminSlug) {
  const url = adminSlug ? `${API_BASE}/sessions?adminSlug=${encodeURIComponent(adminSlug)}` : `${API_BASE}/sessions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không thể tải danh sách phiên');
  return res.json();
}

export async function createSession(sessionData) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  return res.json();
}

export async function updateSession(sessionId, updateData) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return res.json();
}

export async function toggleSessionStatus(sessionId, status) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchOrders(sessionId) {
  const res = await fetch(`${API_BASE}/orders/session/${sessionId}`);
  if (!res.ok) throw new Error('Không thể tải danh sách đơn');
  return res.json();
}

export async function submitOrder(sessionId, orderData) {
  const res = await fetch(`${API_BASE}/orders/session/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return res.json();
}

export async function toggleOrderPayment(orderId, paymentStatus) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentStatus })
  });
  return res.json();
}

export async function deleteOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function updateAdminSettings(settings) {
  const res = await fetch(`${API_BASE}/orders/admin/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

// 🤖 AI Menu Parsing & System Prompt APIs
export async function parseMenuWithAI({ text, apiKey, provider, model, customPrompt }) {
  const res = await fetch(`${API_BASE}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, apiKey, provider, model, customPrompt })
  });
  return res.json();
}

export async function fetchAiPrompt() {
  const res = await fetch(`${API_BASE}/ai/prompt`);
  return res.json();
}

export async function updateAiPrompt(prompt) {
  const res = await fetch(`${API_BASE}/ai/prompt`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  return res.json();
}
