const API = '';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const token = localStorage.getItem('token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function get(path) { return request('GET', path); }
function post(path, body) { return request('POST', path, body); }
function patch(path, body) { return request('PATCH', path, body); }
function del(path) { return request('DELETE', path); }

function isLoggedIn() { return !!localStorage.getItem('token'); }

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => el.classList.remove('show'), 3500);
}

async function loadNav() {
  const user = getUser();
  const nav = document.getElementById('nav-links');
  if (!nav) return;
  if (user) {
    const label = user.keyLogin ? `Key: ${user.product || 'active'}` : user.username;
    nav.innerHTML = `
      <a href="/dashboard/${user.role === 'owner' ? 'owner' : 'customer'}.html">Dashboard</a>
      <a href="#" onclick="logout(); return false;" style="color:var(--red)">Logout</a>
      <span style="color:var(--text-muted);font-size:.85rem">${label}</span>
    `;
  } else {
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = '/login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', loadNav);
