const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

/**
 * Generate a daily code based on date and shop_id
 * Returns a 2-digit code that changes daily
 */
const generateDailyCode = (shopId, date) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const combined = shopId + dateStr;
  
  // Simple hash to generate 2-digit code
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get absolute value and mod by 90, then add 10 to get 10-99
  const code = (Math.abs(hash) % 90) + 10;
  return code.toString();
};

/**
 * GET /api/daily-codes/:shop_id
 * Get or generate daily code for a shop
 */
router.get('/:shop_id', (req, res) => {
  try {
    const { shop_id } = req.params;
    const db = getDatabase();

    // Verify shop exists
    const shop = db.prepare('SELECT * FROM shops WHERE shop_id = ?').get(shop_id);
    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found'
      });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if code exists for today
    let dailyCode = db.prepare(`
      SELECT * FROM daily_codes 
      WHERE shop_id = ? AND date = ?
    `).get(shop_id, todayStr);

    if (!dailyCode) {
      // Generate new code for today
      const code = generateDailyCode(shop_id, today);
      
      // Set expiry to midnight next day
      const expires = new Date(today);
      expires.setDate(expires.getDate() + 1);
      expires.setHours(0, 0, 0, 0);

      db.prepare(`
        INSERT INTO daily_codes (shop_id, code, date, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(shop_id, code, todayStr, expires.toISOString());

      dailyCode = {
        shop_id,
        code,
        date: todayStr,
        expires_at: expires.toISOString()
      };
    }

    res.json({
      code: dailyCode.code,
      date: dailyCode.date,
      expires_at: dailyCode.expires_at,
      valid: true
    });
  } catch (error) {
    console.error('Error getting daily code:', error);
    res.status(500).json({
      error: 'Failed to get daily code',
      details: error.message
    });
  }
});

/**
 * POST /api/daily-codes/verify
 * Verify a daily code
 */
router.post('/verify', (req, res) => {
  try {
    const { shop_id, code } = req.body;

    if (!shop_id || !code) {
      return res.status(400).json({
        error: 'Missing required fields: shop_id, code'
      });
    }

    const db = getDatabase();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const dailyCode = db.prepare(`
      SELECT * FROM daily_codes 
      WHERE shop_id = ? AND date = ?
    `).get(shop_id, todayStr);

    if (!dailyCode) {
      return res.json({
        valid: false,
        error: 'No daily code found for today'
      });
    }

    const isValid = dailyCode.code === code.toString();

    res.json({
      valid: isValid,
      message: isValid ? 'Code verified successfully' : 'Invalid code'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify code',
      details: error.message
    });
  }
});

module.exports = router;
