CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS license_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unused',
  user_id INTEGER,
  duration_days INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  activated_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration_days INTEGER,
  category TEXT
);

CREATE TABLE IF NOT EXISTS product_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_data BLOB,
  file_url TEXT,
  file_size INTEGER NOT NULL DEFAULT 0,
  version TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);
