const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/db');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/shopkeepers/register
 * Register a new shopkeeper (alternative) to an existing shop
 */
router.post('/register', async (req, res) => {
  try {
    const { shop_id, shop_name, name, pin, role = 'alternative' } = req.body;

    if (!shop_id || !name || !pin) {
      return res.status(400).json({
        error: 'Missing required fields: shop_id, name, pin'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        error: 'PIN must be exactly 4 digits'
      });
    }

    const db = getDatabase();

    // Verify shop exists
    const shop = db.prepare('SELECT * FROM shops WHERE shop_id = ?').get(shop_id);
    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found'
      });
    }

    // Verify shop name matches (security check)
    if (shop_name && shop.shop_name !== shop_name) {
      return res.status(400).json({
        error: 'Shop name does not match'
      });
    }

    // Check if shopkeeper already exists with this name for this shop
    const existingShopkeeper = db.prepare(
      'SELECT * FROM shopkeepers WHERE shop_id = ? AND name = ?'
    ).get(shop_id, name);

    if (existingShopkeeper) {
      return res.status(400).json({
        error: 'A shopkeeper with this name already exists for this shop'
      });
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    const result = db.prepare(`
      INSERT INTO shopkeepers (shop_id, name, pin_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(shop_id, name, pin_hash, role);

    res.status(201).json({
      message: 'Shopkeeper registered successfully',
      shopkeeper_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error registering shopkeeper:', error);
    res.status(500).json({
      error: 'Failed to register shopkeeper',
      details: error.message
    });
  }
});

/**
 * POST /api/shopkeepers/get-by-shop
 * Get shopkeeper by shop_id and role for login
 */
router.post('/get-by-shop', (req, res) => {
  try {
    const { shopId, role } = req.body;

    if (!shopId || !role) {
      return res.status(400).json({
        error: 'Missing required fields: shopId, role'
      });
    }

    const db = getDatabase();

    const shopkeeper = db.prepare(`
      SELECT id, shop_id, name, role, pitch_signature 
      FROM shopkeepers 
      WHERE shop_id = ? AND role = ?
    `).get(shopId, role);

    if (!shopkeeper) {
      return res.status(404).json({
        error: 'No shopkeeper found with this role for the given shop'
      });
    }

    res.json(shopkeeper);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve shopkeeper',
      details: error.message
    });
  }
});

/**
 * POST /api/shopkeepers/verify-pin
 * Verify shopkeeper's PIN and return token
 */
router.post('/verify-pin', async (req, res) => {
  try {
    const { shopkeeperId, pin } = req.body;

    if (!shopkeeperId || !pin) {
      return res.status(400).json({
        error: 'Missing required fields: shopkeeperId, pin'
      });
    }

    const db = getDatabase();

    const shopkeeper = db.prepare(`
      SELECT s.*, shops.shop_name 
      FROM shopkeepers s
      JOIN shops ON s.shop_id = shops.shop_id
      WHERE s.id = ?
    `).get(shopkeeperId);

    if (!shopkeeper) {
      return res.status(404).json({
        error: 'Shopkeeper not found'
      });
    }

    const isValidPin = await bcrypt.compare(pin, shopkeeper.pin_hash);

    if (!isValidPin) {
      return res.status(401).json({
        error: 'Invalid PIN'
      });
    }

    const token = generateToken({
      shopkeeper_id: shopkeeper.id,
      shop_id: shopkeeper.shop_id,
      name: shopkeeper.name,
      role: shopkeeper.role
    });

    res.json({
      message: 'Login successful',
      token,
      shop: {
        id: shopkeeper.shop_id,
        name: shopkeeper.shop_name
      },
      shopkeeper: {
        id: shopkeeper.id,
        name: shopkeeper.name,
        role: shopkeeper.role
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify PIN',
      details: error.message
    });
  }
});

/**
 * POST /api/shopkeepers/save-pitch
 * Save voice pitch signature for a shopkeeper
 */
router.post('/save-pitch', async (req, res) => {
  try {
    const { shopkeeperId, pitchSignature } = req.body;

    if (!shopkeeperId || !pitchSignature) {
      return res.status(400).json({
        error: 'Missing required fields: shopkeeperId, pitchSignature'
      });
    }

    const db = getDatabase();

    const result = db.prepare(`
      UPDATE shopkeepers 
      SET pitch_signature = ? 
      WHERE id = ?
    `).run(JSON.stringify(pitchSignature), shopkeeperId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Shopkeeper not found'
      });
    }

    res.json({
      message: 'Pitch signature saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save pitch signature',
      details: error.message
    });
  }
});

/**
 * POST /api/shopkeepers/verify-pitch
 * Verify shopkeeper's voice pitch against stored signature
 */
router.post('/verify-pitch', async (req, res) => {
  try {
    const { shopkeeperId, currentPitch } = req.body;

    if (!shopkeeperId || !currentPitch) {
      return res.status(400).json({
        error: 'Missing required fields: shopkeeperId, currentPitch'
      });
    }

    const db = getDatabase();

    const shopkeeper = db.prepare(`
      SELECT pitch_signature FROM shopkeepers WHERE id = ?
    `).get(shopkeeperId);

    if (!shopkeeper) {
      return res.status(404).json({
        error: 'Shopkeeper not found'
      });
    }

    if (!shopkeeper.pitch_signature) {
      return res.status(400).json({
        error: 'No pitch signature stored for this shopkeeper. Please register your voice first.'
      });
    }

    const storedPitch = JSON.parse(shopkeeper.pitch_signature);
    
    // Allow 15% tolerance for pitch matching
    const tolerance = 0.15;
    const lowerBound = storedPitch.frequency * (1 - tolerance);
    const upperBound = storedPitch.frequency * (1 + tolerance);
    
    const isMatch = currentPitch >= lowerBound && currentPitch <= upperBound;

    res.json({
      verified: isMatch,
      storedFrequency: storedPitch.frequency,
      currentFrequency: currentPitch,
      tolerance: `${tolerance * 100}%`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify pitch',
      details: error.message
    });
  }
});

/**
 * GET /api/shopkeepers/:shop_id
 * Get all shopkeepers for a shop
 */
router.get('/:shop_id', (req, res) => {
  try {
    const { shop_id } = req.params;
    const db = getDatabase();

    const shopkeepers = db.prepare(`
      SELECT id, shop_id, name, role, pitch_signature, created_at 
      FROM shopkeepers 
      WHERE shop_id = ?
    `).all(shop_id);

    res.json({
      count: shopkeepers.length,
      shopkeepers
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve shopkeepers',
      details: error.message
    });
  }
});

module.exports = router;
