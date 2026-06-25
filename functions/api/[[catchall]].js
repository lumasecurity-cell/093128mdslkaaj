// ── Helpers ──

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

function getBody(request) {
  return request.json();
}

// ── Password Hashing (PBKDF2 via Web Crypto) ──

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  const result = new Uint8Array(48);
  result.set(salt);
  result.set(new Uint8Array(hash), 16);
  return btoa(String.fromCharCode(...result));
}

async function verifyPassword(password, stored) {
  try {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const storedHash = raw.slice(16);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      key, 256
    );
    const hashArr = new Uint8Array(hash);
    if (hashArr.length !== storedHash.length) return false;
    return hashArr.every((v, i) => v === storedHash[i]);
  } catch {
    return false;
  }
}

// ── JWT ──

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${headerB64}.${payloadB64}`));
  return `${headerB64}.${payloadB64}.${base64url(sig)}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    return JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
  } catch {
    return null;
  }
}

// ── D1 Queries ──

function q(db, sql, params = []) {
  return db.prepare(sql).bind(...params);
}

function qAll(db, sql, params = []) {
  return q(db, sql, params).all().results;
}

function qOne(db, sql, params = []) {
  const rows = qAll(db, sql, params);
  return rows.length ? rows[0] : null;
}

function qRun(db, sql, params = []) {
  return q(db, sql, params).run();
}

// ── Route Handler ──

async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  const method = request.method;
  const db = env.DB;
  const JWT_SECRET = (env && env.JWT_SECRET) || 'sleepy-ud-secret-change-in-production';

  // Auto-seed on first request
  const productCount = qOne(db, 'SELECT COUNT(*) as c FROM products').c;
  if (productCount === 0) {
    // Seed products
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['woofer-monthly', 'Woofer', 'Kernel-mode HWID spoofer \u2013 Monthly subscription', 14.99, 30, 'monthly']);
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['woofer-lifetime', 'Woofer Lifetime', 'Kernel-mode HWID spoofer \u2013 Lifetime access', 49.99, null, 'lifetime']);
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['noxy-monthly', 'NOXY VGC Emulator', 'Vanguard authentication emulator \u2013 Monthly subscription', 19.99, 30, 'monthly']);
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['noxy-lifetime', 'NOXY VGC Emulator Lifetime', 'Vanguard authentication emulator \u2013 Lifetime access', 69.99, null, 'lifetime']);
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['bundle-monthly', 'Sleepy UD Bundle', 'Woofer + NOXY VGC Emulator \u2013 Monthly subscription', 29.99, 30, 'monthly']);
    qRun(db, 'INSERT INTO products (name, display_name, description, price, duration_days, category) VALUES (?, ?, ?, ?, ?, ?)', ['bundle-lifetime', 'Sleepy UD Bundle Lifetime', 'Woofer + NOXY VGC Emulator \u2013 Lifetime access', 99.99, null, 'lifetime']);
  }

  const ownerCount = qOne(db, 'SELECT COUNT(*) as c FROM users WHERE role = ?', ['owner']).c;
  if (ownerCount === 0) {
    const adminHash = await hashPassword('admin123');
    qRun(db, 'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', ['admin', adminHash, 'admin@sleepyud.com', 'owner']);
  }

  // ─── AUTH ROUTES ───

  if (path === 'auth/register' && method === 'POST') {
    const { username, password, email } = await getBody(request);
    if (!username || !password || !email) return error('Username, password, and email required');
    if (password.length < 6) return error('Password must be at least 6 characters');

    const existing = qOne(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) return error('Username or email already taken', 409);

    const hash = await hashPassword(password);
    qRun(db, 'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', [username, hash, email, 'customer']);

    const created = qOne(db, 'SELECT * FROM users WHERE username = ?', [username]);
    const token = await signJWT({ id: created.id, username, role: 'customer' }, JWT_SECRET);
    return json({ token, user: { id: created.id, username, email, role: 'customer' } }, 201);
  }

  if (path === 'auth/login' && method === 'POST') {
    const { username, password } = await getBody(request);
    if (!username || !password) return error('Username and password required');

    const user = qOne(db, 'SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !(await verifyPassword(password, user.password))) return error('Invalid credentials', 401);

    qRun(db, 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const token = await signJWT({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    return json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  }

  if (path === 'auth/key-login' && method === 'POST') {
    const { key } = await getBody(request);
    if (!key) return error('License key required');

    const license = qOne(db, 'SELECT * FROM license_keys WHERE key = ?', [key]);
    if (!license) return error('Invalid license key', 401);
    if (license.status === 'banned') return error('This key has been banned', 403);
    if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < new Date())) {
      return error('This key has expired', 403);
    }

    const token = await signJWT({
      id: license.user_id || `key:${license.id}`,
      username: `key:${license.key.slice(0, 8)}...`,
      role: 'customer',
      keyLogin: true,
      licenseId: license.id,
    }, JWT_SECRET);

    return json({ token, user: { keyLogin: true, product: license.product, status: license.status } });
  }

  // ─── AUTH MIDDLEWARE ───

  const authHeader = request.headers.get('Authorization');
  let user = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    user = await verifyJWT(authHeader.slice(7), JWT_SECRET);
  }

  function requireAuth() {
    if (!user) return error('No token provided', 401);
    return null;
  }

  function requireOwner() {
    if (!user) return error('No token provided', 401);
    if (user.role !== 'owner') return error('Owner access required', 403);
    return null;
  }

  // ─── KEY ROUTES ───

  if (path === 'keys/stats' && method === 'GET') {
    const err = requireOwner(); if (err) return err;
    const total = qOne(db, 'SELECT COUNT(*) as c FROM license_keys').c;
    const active = qOne(db, 'SELECT COUNT(*) as c FROM license_keys WHERE status = ?', ['active']).c;
    const unused = qOne(db, 'SELECT COUNT(*) as c FROM license_keys WHERE status = ?', ['unused']).c;
    const expired = qOne(db, 'SELECT COUNT(*) as c FROM license_keys WHERE status = ?', ['expired']).c;
    const banned = qOne(db, 'SELECT COUNT(*) as c FROM license_keys WHERE status = ?', ['banned']).c;
    const users = qOne(db, 'SELECT COUNT(*) as c FROM users WHERE role = ?', ['customer']).c;
    return json({ total, active, unused, expired, banned, users });
  }

  if (path === 'keys/all' && method === 'GET') {
    const err = requireOwner(); if (err) return err;
    const keys = qAll(db, `
      SELECT lk.*, u.username AS assigned_user
      FROM license_keys lk
      LEFT JOIN users u ON lk.user_id = u.id
      ORDER BY lk.created_at DESC
    `);
    return json(keys);
  }

  if (path === 'keys/generate' && method === 'POST') {
    const err = requireOwner(); if (err) return err;
    const { product, duration_days, quantity = 1 } = await getBody(request);
    if (!product) return error('Product name required');

    const keys = [];
    for (let i = 0; i < quantity; i++) {
      const k = generateKey();
      qRun(db, 'INSERT INTO license_keys (key, product, duration_days, status) VALUES (?, ?, ?, ?)', [k, product, duration_days || null, 'unused']);
      keys.push(k);
    }
    return json({ keys, count: keys.length, product }, 201);
  }

  if (path === 'keys/my-keys' && method === 'GET') {
    const err = requireAuth(); if (err) return err;
    const keys = qAll(db, 'SELECT * FROM license_keys WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
    return json(keys);
  }

  if (path === 'keys/redeem' && method === 'POST') {
    const err = requireAuth(); if (err) return err;
    const { key } = await getBody(request);
    if (!key) return error('Key required');

    const license = qOne(db, 'SELECT * FROM license_keys WHERE key = ?', [key]);
    if (!license) return error('Invalid key', 404);
    if (license.status !== 'unused') return error('Key already used or not available', 409);

    const expiresAt = license.duration_days
      ? new Date(Date.now() + license.duration_days * 86400000).toISOString()
      : null;

    qRun(db, 'UPDATE license_keys SET user_id = ?, status = ?, activated_at = CURRENT_TIMESTAMP, expires_at = ? WHERE id = ?',
      [user.id, 'active', expiresAt, license.id]);

    return json({ ok: true, product: license.product, expires_at: expiresAt });
  }

  // PATCH /api/keys/:id/status
  const keyStatusMatch = path.match(/^keys\/(\d+)\/status$/);
  if (keyStatusMatch && method === 'PATCH') {
    const err = requireOwner(); if (err) return err;
    const { status } = await getBody(request);
    if (!['unused', 'active', 'expired', 'banned'].includes(status)) return error('Invalid status');
    qRun(db, 'UPDATE license_keys SET status = ? WHERE id = ?', [status, keyStatusMatch[1]]);
    return json({ ok: true });
  }

  // ─── CUSTOMER ROUTES ───

  if (path === 'customer/profile' && method === 'GET') {
    const err = requireAuth(); if (err) return err;
    if (user.keyLogin) {
      const license = qOne(db, 'SELECT * FROM license_keys WHERE id = ?', [user.licenseId]);
      return json({ keyLogin: true, license });
    }
    const u = qOne(db, 'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?', [user.id]);
    if (!u) return error('User not found', 404);
    return json(u);
  }

  if (path === 'customer/products' && method === 'GET') {
    const products = qAll(db, 'SELECT * FROM products');
    return json(products);
  }

  if (path === 'customer/downloads' && method === 'GET') {
    const err = requireAuth(); if (err) return err;
    const keys = qAll(db, 'SELECT product, status FROM license_keys WHERE user_id = ? AND status = ?', [user.id, 'active']);
    const products = [...new Set(keys.map(k => k.product))];
    return json({ available: products.length > 0, products });
  }

  // ─── 404 ───

  return error('Not found', 404);
}

function generateKey() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase());
  }
  return parts.join('-');
}

export async function onRequest(context) {
  try {
    return await handleRequest(context);
  } catch (err) {
    console.error('API Error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}
