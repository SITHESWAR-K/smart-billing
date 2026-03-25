const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/supabase');
const { generateToken } = require('../middleware/auth');

const SHOP_ID_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

// Generate short shop ID (6 characters)
const generateShopId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

    const supabase = getDatabase();

    // Generate unique short shop ID
    let shop_id;
    let attempts = 0;
    while (attempts < 20) {
      const candidate = generateShopId().toUpperCase();
      const { data: existing, error: existingError } = await supabase
        .from('shops')
        .select('shop_id')
        .eq('shop_id', candidate)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (!existing && SHOP_ID_REGEX.test(candidate)) {
        shop_id = candidate;
        break;
      }

      attempts++;
    }

    if (!shop_id) {
      return res.status(500).json({
        error: 'Failed to generate unique shop ID'
      });
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    // Insert shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        shop_id,
        shop_name,
        shopkeeper_name,
        location: location || null
      })
      .select()
      .single();

    if (shopError) {
      // Retry once if a race condition caused duplicate key collision.
      if (shopError.code === '23505') {
        return res.status(409).json({ error: 'Please retry shop creation' });
      }
      if (shopError.code === '23514') {
        return res.status(400).json({
          error: 'Generated shop ID failed database validation',
          details: `shop_id=${shop_id}`
        });
      }
      throw shopError;
    }

    // Insert main shopkeeper
    const { error: keeperError } = await supabase
      .from('shopkeepers')
      .insert({
        shop_id,
        name: shopkeeper_name,
        pin_hash,
        role: 'main'
      });

    if (keeperError) throw keeperError;

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
router.get('/:shop_id', async (req, res) => {
  try {
    const { shop_id } = req.params;
    const supabase = getDatabase();

    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', shop_id)
      .single();

    if (error || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { data: shopkeepers } = await supabase
      .from('shopkeepers')
      .select('id, name, role, pitch_signature')
      .eq('shop_id', shop_id);

    res.json({ ...shop, shopkeepers: shopkeepers || [] });
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
router.get('/', async (req, res) => {
  try {
    const supabase = getDatabase();
    
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

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
