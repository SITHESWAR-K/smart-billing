const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/supabase');

/**
 * POST /api/bills
 */
router.post('/', async (req, res) => {
  try {
    const { shop_id, items, total, created_by } = req.body;

    if (!shop_id || !Array.isArray(items) || items.length === 0 || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getDatabase();

    const productIds = items.map(item => item.productId).filter(Boolean);
    if (productIds.length !== items.length) {
      return res.status(400).json({ error: 'Each bill item must include productId' });
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, quantity')
      .eq('shop_id', shop_id)
      .in('id', productIds);

    if (productsError) throw productsError;

    const productsById = new Map((products || []).map(product => [String(product.id), product]));
    const lowStockAlerts = [];

    for (const item of items) {
      const product = productsById.get(String(item.productId));
      const quantityToReduce = Number(item.quantity) || 1;

      if (!product) {
        return res.status(400).json({ error: `Product not found for productId: ${item.productId}` });
      }

      if (product.quantity !== null && product.quantity !== undefined) {
        const currentQty = Number(product.quantity);
        if (Number.isFinite(currentQty) && currentQty < quantityToReduce) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${currentQty}, requested: ${quantityToReduce}`
          });
        }
      }
    }

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

    // Best-effort stock updates after bill insert.
    for (const item of items) {
      const product = productsById.get(String(item.productId));
      const quantityToReduce = Number(item.quantity) || 1;

      if (product && product.quantity !== null && product.quantity !== undefined) {
        const currentQty = Number(product.quantity);
        const newQty = Number((currentQty - quantityToReduce).toFixed(2));

        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', item.productId)
          .eq('shop_id', shop_id);

        if (updateError) throw updateError;

        if (newQty <= 5) {
          lowStockAlerts.push({
            productId: product.id,
            productName: product.name,
            remainingQuantity: newQty
          });
        }
      }
    }

    res.status(201).json({ message: 'Bill created successfully', bill: data, low_stock_alerts: lowStockAlerts });
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
