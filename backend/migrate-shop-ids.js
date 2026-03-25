// Run this script to migrate existing shop IDs to short format
// Usage: node migrate-shop-ids.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'smart_billing.db');
const db = new Database(dbPath);

// Generate short shop ID (6 characters)
const generateShopId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const migrateShopIds = () => {
  try {
    // Get all shops with long IDs (UUIDs are 36 chars)
    const shops = db.prepare('SELECT shop_id FROM shops WHERE LENGTH(shop_id) > 6').all();

    if (shops.length === 0) {
      console.log('No shops need migration. All shop IDs are already short.');
      return;
    }

    console.log(`Found ${shops.length} shop(s) to migrate...`);

    // Disable foreign key checks temporarily
    db.pragma('foreign_keys = OFF');

    for (const shop of shops) {
      const oldId = shop.shop_id;
      let newId;

      // Generate unique short ID
      let attempts = 0;
      do {
        newId = generateShopId();
        const existing = db.prepare('SELECT shop_id FROM shops WHERE shop_id = ?').get(newId);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      // Update all tables with new shop_id
      db.prepare('UPDATE shops SET shop_id = ? WHERE shop_id = ?').run(newId, oldId);
      db.prepare('UPDATE shopkeepers SET shop_id = ? WHERE shop_id = ?').run(newId, oldId);
      db.prepare('UPDATE daily_codes SET shop_id = ? WHERE shop_id = ?').run(newId, oldId);
      db.prepare('UPDATE products SET shop_id = ? WHERE shop_id = ?').run(newId, oldId);
      db.prepare('UPDATE bills SET shop_id = ? WHERE shop_id = ?').run(newId, oldId);

      console.log(`Migrated: ${oldId} → ${newId}`);
    }

    // Re-enable foreign key checks
    db.pragma('foreign_keys = ON');

    console.log('\nMigration complete! New short shop IDs:');
    const updatedShops = db.prepare('SELECT shop_id, shop_name FROM shops').all();
    updatedShops.forEach(s => console.log(`  ${s.shop_id} - ${s.shop_name}`));

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    db.close();
  }
};

migrateShopIds();
