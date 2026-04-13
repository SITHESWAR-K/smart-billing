const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/supabase');

/**
 * GET /api/products/:shop_id
 */
router.get('/:shop_id', async (req, res) => {
  try {
    const shop_id = req.params.shop_id.trim().toUpperCase();
    const supabase = getDatabase();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ count: products?.length || 0, products: products || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve products', details: error.message });
  }
});

/**
 * POST /api/products
 */
router.post('/', async (req, res) => {
  try {
    const { shop_id, name, synonyms, quantity, price, brand, expiry_date } = req.body;
    const normalizedShopId = shop_id?.trim().toUpperCase();
    const normalizedName = name?.trim();
    const normalizedBrand = brand?.trim() || null;

    if (!normalizedShopId || !normalizedName || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getDatabase();

    let existingQuery = supabase
      .from('products')
      .select('*')
      .eq('shop_id', normalizedShopId)
      .ilike('name', normalizedName);

    if (normalizedBrand) {
      existingQuery = existingQuery.ilike('brand', normalizedBrand);
    } else {
      existingQuery = existingQuery.is('brand', null);
    }

    const { data: existingProducts, error: existingError } = await existingQuery;
    if (existingError) throw existingError;

    if (existingProducts && existingProducts.length > 0) {
      const existing = existingProducts[0];
      const existingQty = Number.parseFloat(existing.quantity) || 0;
      const incomingQty = Number.parseFloat(quantity) || 0;
      const incomingPrice = Number.parseFloat(price);

      const updateData = {
        quantity: Number((existingQty + incomingQty).toFixed(2)),
        updated_at: new Date().toISOString()
      };

      if (Number.isFinite(incomingPrice) && incomingPrice > 0) {
        updateData.price = incomingPrice;
      }

      if (expiry_date !== undefined) {
        updateData.expiry_date = expiry_date || null;
      }

      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', existing.id)
        .eq('shop_id', normalizedShopId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.json({ message: 'Product already exists, quantity updated', product: updated });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: normalizedShopId,
        name: normalizedName,
        synonyms: synonyms || [],
        quantity: quantity || 0,
        price: parseFloat(price),
        brand: normalizedBrand,
        expiry_date: expiry_date || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Product added successfully', product: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
});

/**
 * PUT /api/products/:shop_id/:id
 */
router.put('/:shop_id/:id', async (req, res) => {
  try {
    const { shop_id, id } = req.params;
    const { name, synonyms, quantity, price, brand, expiry_date } = req.body;

    const supabase = getDatabase();

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (synonyms !== undefined) updateData.synonyms = synonyms;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (brand !== undefined) updateData.brand = brand;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date || null;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('shop_id', shop_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Product updated successfully', product: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

/**
 * DELETE /api/products/:shop_id/:id
 */
router.delete('/:shop_id/:id', async (req, res) => {
  try {
    const { shop_id, id } = req.params;
    const supabase = getDatabase();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('shop_id', shop_id);

    if (error) throw error;

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

module.exports = router;
