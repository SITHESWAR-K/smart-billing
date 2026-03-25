const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/supabase');

/**
 * GET /api/health
 * Check server health status
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { count, error } = await db
      .from('shops')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    
    res.json({
      status: 'ok',
      message: 'Smart Billing Backend is operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
      shops: count || 0
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
