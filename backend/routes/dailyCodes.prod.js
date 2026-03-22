const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDatabase } = require('../database/supabase');

/**
 * GET /api/daily-codes/:shop_id
 */
router.get('/:shop_id', async (req, res) => {
  try {
    const { shop_id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const supabase = getDatabase();

    // Check if code exists for today
    const { data: existing } = await supabase
      .from('daily_codes')
      .select('*')
      .eq('shop_id', shop_id)
      .eq('date', today)
      .single();

    if (existing) {
      return res.json({
        code: existing.code,
        date: existing.date,
        expires_at: existing.expires_at
      });
    }

    // Generate new code
    const hash = crypto.createHash('sha256')
      .update(`${shop_id}-${today}-${process.env.JWT_SECRET || 'secret'}`)
      .digest('hex');
    const code = hash.substring(0, 6).toUpperCase();
    
    const expires_at = new Date();
    expires_at.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('daily_codes')
      .insert({
        shop_id,
        code,
        date: today,
        expires_at: expires_at.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      code: data.code,
      date: data.date,
      expires_at: data.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get daily code', details: error.message });
  }
});

/**
 * POST /api/daily-codes/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { shop_id, code } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const supabase = getDatabase();

    const { data: daily } = await supabase
      .from('daily_codes')
      .select('*')
      .eq('shop_id', shop_id)
      .eq('date', today)
      .single();

    if (!daily) {
      return res.status(404).json({ error: 'No code found for today' });
    }

    const isValid = daily.code.toLowerCase() === code.toLowerCase();
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify code', details: error.message });
  }
});

module.exports = router;
