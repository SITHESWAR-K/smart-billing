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

    if (!shop_id || !name || !pin) {
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
      .eq('shop_id', shop_id)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if shopkeeper exists
    const { data: existing } = await supabase
      .from('shopkeepers')
      .select('id')
      .eq('shop_id', shop_id)
      .eq('name', name)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Shopkeeper already exists' });
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    const { data, error } = await supabase
      .from('shopkeepers')
      .insert({ shop_id, name, pin_hash, role })
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

    if (!shopId || !role) {
      return res.status(400).json({ error: 'Missing required fields: shopId, role' });
    }

    const supabase = getDatabase();

    const { data: shopkeeper, error } = await supabase
      .from('shopkeepers')
      .select('id, shop_id, name, role, pitch_signature')
      .eq('shop_id', shopId)
      .eq('role', role)
      .single();

    if (error || !shopkeeper) {
      return res.status(404).json({ error: 'Shopkeeper not found' });
    }

    res.json(shopkeeper);
  } catch (error) {
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
        role: shopkeeper.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify PIN', details: error.message });
  }
});

/**
 * POST /api/shopkeepers/save-pitch
 */
router.post('/save-pitch', async (req, res) => {
  try {
    const { shopkeeperId, pitchSignature } = req.body;

    if (!shopkeeperId || !pitchSignature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getDatabase();

    const { error } = await supabase
      .from('shopkeepers')
      .update({ pitch_signature: JSON.stringify(pitchSignature) })
      .eq('id', shopkeeperId);

    if (error) throw error;

    res.json({ message: 'Pitch signature saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pitch signature', details: error.message });
  }
});

/**
 * POST /api/shopkeepers/verify-pitch
 */
router.post('/verify-pitch', async (req, res) => {
  try {
    const { shopkeeperId, currentPitch } = req.body;

    if (!shopkeeperId || !currentPitch) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getDatabase();

    const { data: shopkeeper, error } = await supabase
      .from('shopkeepers')
      .select('pitch_signature')
      .eq('id', shopkeeperId)
      .single();

    if (error || !shopkeeper) {
      return res.status(404).json({ error: 'Shopkeeper not found' });
    }

    if (!shopkeeper.pitch_signature) {
      return res.status(400).json({ error: 'No pitch signature stored' });
    }

    const storedPitch = JSON.parse(shopkeeper.pitch_signature);
    const tolerance = 0.15;
    const lowerBound = storedPitch.frequency * (1 - tolerance);
    const upperBound = storedPitch.frequency * (1 + tolerance);
    const isMatch = currentPitch >= lowerBound && currentPitch <= upperBound;

    res.json({
      verified: isMatch,
      storedFrequency: storedPitch.frequency,
      currentFrequency: currentPitch
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify pitch', details: error.message });
  }
});

module.exports = router;
