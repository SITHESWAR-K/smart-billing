const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

/**
 * GET /api/health
 * Check server health status
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const shopCount = db.prepare('SELECT COUNT(*) as count FROM shops').get();
    
    res.json({
      status: 'ok',
      message: 'Smart Billing Backend is operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
      shops: shopCount.count
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;
