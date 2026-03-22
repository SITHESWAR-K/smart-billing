const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { shop_id, name, synonyms, quantity, price, brand } = req.body;

    if (!shop_id || !name || price === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: shop_id, name, price'
      });
    }

    const db = getDatabase();

    const result = db.prepare(`
      INSERT INTO products (shop_id, name, synonyms, quantity, price, brand)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      shop_id,
      name,
      synonyms ? JSON.stringify(synonyms) : null,
      quantity || null,
      price,
      brand || null
    );

    res.status(201).json({
      message: 'Product created successfully',
      product_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    });
  }
});

/**
 * GET /api/products/:shop_id
 * Get products for a shop
 */
router.get('/:shop_id', (req, res) => {
  try {
    const { shop_id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const db = getDatabase();
    const products = db.prepare(`
      SELECT * FROM products 
      WHERE shop_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(shop_id, parseInt(limit), parseInt(offset));

    const countResult = db.prepare('SELECT COUNT(*) as count FROM products WHERE shop_id = ?').get(shop_id);

    res.json({
      count: countResult.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      products: products.map(product => ({
        ...product,
        synonyms: product.synonyms ? JSON.parse(product.synonyms) : []
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve products',
      details: error.message
    });
  }
});

/**
 * PUT /api/products/:shop_id/:product_id
 * Update a product
 */
router.put('/:shop_id/:product_id', authenticateToken, (req, res) => {
  try {
    const { shop_id, product_id } = req.params;
    const { name, synonyms, quantity, price, brand } = req.body;

    const db = getDatabase();

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (synonyms !== undefined) {
      updateFields.push('synonyms = ?');
      values.push(JSON.stringify(synonyms));
    }
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      values.push(quantity);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      values.push(price);
    }
    if (brand !== undefined) {
      updateFields.push('brand = ?');
      values.push(brand);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(product_id, shop_id);

    const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ? AND shop_id = ?`;
    const result = db.prepare(query).run(...values);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update product',
      details: error.message
    });
  }
});

/**
 * DELETE /api/products/:shop_id/:product_id
 * Delete a product
 */
router.delete('/:shop_id/:product_id', authenticateToken, (req, res) => {
  try {
    const { shop_id, product_id } = req.params;
    const db = getDatabase();

    const result = db.prepare('DELETE FROM products WHERE id = ? AND shop_id = ?').run(product_id, shop_id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete product',
      details: error.message
    });
  }
});

module.exports = router;
