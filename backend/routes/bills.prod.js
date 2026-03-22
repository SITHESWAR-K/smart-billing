const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/supabase');

/**
 * POST /api/bills
 */
router.post('/', async (req, res) => {
  try {
    const { shop_id, items, total, created_by } = req.body;

    if (!shop_id || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getDatabase();

    const { data, error } = await supabase
      .from('bills')
      .insert({
        shop_id,
        items,
        total: parseFloat(total),
        created_by: created_by || 'Unknown'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Bill created successfully', bill: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bill', details: error.message });
  }
});

/**
 * GET /api/bills/:shop_id
 */
router.get('/:shop_id', async (req, res) => {
  try {
    const { shop_id } = req.params;
    const { limit = 50 } = req.query;

    const supabase = getDatabase();

    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json(bills || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bills', details: error.message });
  }
});

/**
 * GET /api/bills/single/:id
 */
router.get('/single/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getDatabase();

    const { data: bill, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bill', details: error.message });
  }
});

module.exports = router;
