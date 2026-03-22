const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the database directory
const dbPath = path.join(__dirname, 'smart_billing.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  try {
    // Create shops table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT UNIQUE NOT NULL,
        shop_name TEXT NOT NULL,
        shopkeeper_name TEXT NOT NULL,
        location TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create shopkeepers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS shopkeepers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        name TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('main', 'alternative')),
        pitch_signature TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
      )
    `);

    // Create daily_codes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        code TEXT NOT NULL,
        date TEXT NOT NULL,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
      )
    `);

    // Create products table
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        name TEXT NOT NULL,
        synonyms TEXT,
        quantity REAL,
        price REAL,
        brand TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
      )
    `);

    // Create bills table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const getDatabase = () => {
  return db;
};

module.exports = {
  db,
  initDatabase,
  getDatabase
};
