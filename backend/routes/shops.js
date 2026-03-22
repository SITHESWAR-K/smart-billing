const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/db');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/shops
 * Create a new shop
 */
router.post('/', async (req, res) => {
  try {
    const { shop_name, shopkeeper_name, location, pin } = req.body;

    if (!shop_name || !shopkeeper_name || !pin) {
      return res.status(400).json({
        error: 'Missing required fields: shop_name, shopkeeper_name, pin'
      });
    }

    const db = getDatabase();
    const shop_id = uuidv4();
    const pin_hash = await bcrypt.hash(pin, 10);

    // Insert shop
    db.prepare(`
      INSERT INTO shops (shop_id, shop_name, shopkeeper_name, location)
      VALUES (?, ?, ?, ?)
    `).run(shop_id, shop_name, shopkeeper_name, location || null);

    // Insert main shopkeeper
    db.prepare(`
      INSERT INTO shopkeepers (shop_id, name, pin_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(shop_id, shopkeeper_name, pin_hash, 'main');

    const token = generateToken({ shop_id, name: shopkeeper_name, role: 'main' });

    res.status(201).json({
      message: 'Shop created successfully',
      shop_id,
      token
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({
      error: 'Failed to create shop',
      details: error.message
    });
  }
});

/**
 * GET /api/shops/:shop_id
 * Get shop details
 */
router.get('/:shop_id', (req, res) => {
  try {
    const { shop_id } = req.params;
    const db = getDatabase();

    const shop = db.prepare('SELECT * FROM shops WHERE shop_id = ?').get(shop_id);

    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found'
      });
    }

    const shopkeepers = db.prepare('SELECT id, name, role, pitch_signature FROM shopkeepers WHERE shop_id = ?').all(shop_id);

    res.json({
      ...shop,
      shopkeepers
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve shop',
      details: error.message
    });
  }
});

/**
 * GET /api/shops
 * Get all shops
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const shops = db.prepare('SELECT * FROM shops ORDER BY created_at DESC').all();

    res.json({
      count: shops.length,
      shops
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve shops',
      details: error.message
    });
  }
});

module.exports = router;
