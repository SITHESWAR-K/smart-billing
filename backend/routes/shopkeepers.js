const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/supabase');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/shopkeepers/register
 */
router.post('/register', async (req, res) => {
  try {
    const { shop_id, shop_name, name, pin, role = 'alternative' } = req.body;
    const normalizedShopId = shop_id?.trim().toUpperCase();

    if (!normalizedShopId || !name || !pin) {
      return res.status(400).json({
        error: 'Missing required fields: shop_id, name, pin'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    const supabase = getDatabase();

    // Verify shop exists
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', normalizedShopId)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if shopkeeper exists
    const { data: existing } = await supabase
      .from('shopkeepers')
      .select('id')
      .eq('shop_id', normalizedShopId)
      .eq('name', name)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Shopkeeper already exists' });
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    const { data, error } = await supabase
      .from('shopkeepers')
      .insert({ shop_id: normalizedShopId, name, pin_hash, role })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Shopkeeper registered successfully',
      shopkeeper_id: data.id
    });
  } catch (error) {
    console.error('Error registering shopkeeper:', error);
    res.status(500).json({ error: 'Failed to register shopkeeper', details: error.message });
  }
});

/**
 * POST /api/shopkeepers/get-by-shop
 */
router.post('/get-by-shop', async (req, res) => {
  try {
    const { shopId, role } = req.body;
    const normalizedShopId = shopId?.trim().toUpperCase();

    console.log('get-by-shop called with:', { shopId: normalizedShopId, role });

    if (!normalizedShopId || !role) {
      return res.status(400).json({ error: 'Missing required fields: shopId, role' });
    }

    const supabase = getDatabase();

    // Get ALL shopkeepers with this role (not just one)
    const { data: shopkeepers, error } = await supabase
      .from('shopkeepers')
      .select('id, shop_id, name, role, pitch_signature, voice_signature, voice_enrolled_at')
      .eq('shop_id', normalizedShopId)
      .eq('role', role);

    console.log('Supabase query result:', { count: shopkeepers?.length, error });

    if (error) {
      console.error('Error fetching shopkeepers:', error);
      return res.status(500).json({ error: 'Failed to retrieve shopkeepers', details: error.message });
    }

    if (!shopkeepers || shopkeepers.length === 0) {
      console.log('No shopkeepers found for shop_id:', normalizedShopId, 'role:', role);
      return res.status(404).json({
        error: `No ${role} shopkeeper found for this shop`,
        shop_id: normalizedShopId,
        role: role
      });
    }

    console.log('Found', shopkeepers.length, 'shopkeeper(s):', shopkeepers.map(s => s.name));

    // If only one shopkeeper, return directly (backwards compatible)
    if (shopkeepers.length === 1) {
      return res.json(shopkeepers[0]);
    }

    // If multiple shopkeepers, return all of them
    res.json({
      multiple: true,
      shopkeepers: shopkeepers
    });
  } catch (error) {
    console.error('get-by-shop error:', error);
    res.status(500).json({ error: 'Failed to retrieve shopkeeper', details: error.message });
  }
});

/**
 * POST /api/shopkeepers/verify-pin
 */
router.post('/verify-pin', async (req, res) => {
  try {
    const { shopkeeperId, pin } = req.body;

    if (!shopkeeperId || !pin) {
      return res.status(400).json({ error: 'Missing required fields: shopkeeperId, pin' });
    }

    const supabase = getDatabase();

    const { data: shopkeeper, error } = await supabase
      .from('shopkeepers')
      .select('*, shops(shop_name)')
      .eq('id', shopkeeperId)
      .single();

    if (error || !shopkeeper) {
      return res.status(404).json({ error: 'Shopkeeper not found' });
    }

    const isValidPin = await bcrypt.compare(pin, shopkeeper.pin_hash);

    if (!isValidPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
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
        name: shopkeeper.shops?.shop_name
      },
      shopkeeper: {
        id: shopkeeper.id,
        name: shopkeeper.name,
        role: shopkeeper.role,
        voice_signature: shopkeeper.voice_signature || null,
        voice_enrolled_at: shopkeeper.voice_enrolled_at || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify PIN', details: error.message });
  }
});

/**
 * POST /api/shopkeepers/voice-enroll
 * Save voice signature for low-accuracy verification
 */
router.post('/voice-enroll', async (req, res) => {
  try {
    const { shopkeeperId, voiceSignature } = req.body;

    if (!shopkeeperId || !voiceSignature) {
      return res.status(400).json({ error: 'Missing required fields: shopkeeperId, voiceSignature' });
    }

    const supabase = getDatabase();
    const signatureValue = typeof voiceSignature === 'string'
      ? voiceSignature
      : JSON.stringify(voiceSignature);

    const { data, error } = await supabase
      .from('shopkeepers')
      .update({
        voice_signature: signatureValue,
        voice_enrolled_at: new Date().toISOString()
      })
      .eq('id', shopkeeperId)
      .select('id, voice_signature, voice_enrolled_at')
      .single();

    if (error) throw error;

    res.json({
      message: 'Voice signature enrolled',
      shopkeeper: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll voice signature', details: error.message });
  }
});

module.exports = router;
