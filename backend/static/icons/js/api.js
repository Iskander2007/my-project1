const API_URL = https://clickclear-backend.onrender.com
const token = () => localStorage.getItem("token");
const auth = () => token() ? { Authorization: `Bearer ${token()}` } : {};

// ========== AUTH ==========
export async function register(data) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function login(data) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const out = await res.json();
  if (res.ok) {
    localStorage.setItem("token", out.access);
    localStorage.setItem("user", JSON.stringify(out.user));
  }
  return out;
}

export async function me() {
  const res = await fetch(`${API}/api/auth/me`, { headers: auth() });
  return res.json();
}

// ========== META ==========
export const getDistricts = async () => {
  const res = await fetch(`${API}/api/meta/districts`);
  return res.json();
};

export const getSlots = async () => {
  const res = await fetch(`${API}/api/meta/slots`);
  return res.json();
};

// ========== ORDERS ==========
export async function createOrder(payload) {
  const res = await fetch(`${API}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getFeed(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/api/orders?${q}`, { headers: auth() });
  return res.json();
}

export const takeOrder = (id) =>
  fetch(`${API}/api/orders/${id}/take`, { method: "POST", headers: auth() }).then(r => r.json());

export const completeOrder = (id) =>
  fetch(`${API}/api/orders/${id}/complete`, { method: "POST", headers: auth() }).then(r => r.json());

export const cancelOrder = (id) =>
  fetch(`${API}/api/orders/${id}/cancel`, { method: "POST", headers: auth() }).then(r => r.json());

export const failOrder = (id, comment = "") =>
  fetch(`${API}/api/orders/${id}/failed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ comment })
  }).then(r => r.json());
<div class="nav-item" onclick="toggleTheme()">
  <img src="assets/icons/theme.svg">
    Тема
</div>
