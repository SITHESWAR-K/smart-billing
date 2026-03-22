const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/bills
 * Create a new bill
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { shop_id, items, total, created_by } = req.body;

    if (!shop_id || !items || !total) {
      return res.status(400).json({
        error: 'Missing required fields: shop_id, items, total'
      });
    }

    const db = getDatabase();

    const result = db.prepare(`
      INSERT INTO bills (shop_id, items, total, created_by)
      VALUES (?, ?, ?, ?)
    `).run(shop_id, JSON.stringify(items), total, created_by || req.user.name);

    res.status(201).json({
      message: 'Bill created successfully',
      bill_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      error: 'Failed to create bill',
      details: error.message
    });
  }
});

/**
 * GET /api/bills/:shop_id
 * Get bills for a shop
 */
router.get('/:shop_id', (req, res) => {
  try {
    const { shop_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const db = getDatabase();
    const bills = db.prepare(`
      SELECT * FROM bills 
      WHERE shop_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(shop_id, parseInt(limit), parseInt(offset));

    const countResult = db.prepare('SELECT COUNT(*) as count FROM bills WHERE shop_id = ?').get(shop_id);

    res.json({
      count: countResult.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      bills: bills.map(bill => ({
        ...bill,
        items: JSON.parse(bill.items)
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve bills',
      details: error.message
    });
  }
});

/**
 * GET /api/bills/:shop_id/:bill_id
 * Get a specific bill
 */
router.get('/:shop_id/:bill_id', (req, res) => {
  try {
    const { shop_id, bill_id } = req.params;
    const db = getDatabase();

    const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND shop_id = ?').get(bill_id, shop_id);

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    res.json({
      ...bill,
      items: JSON.parse(bill.items)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve bill',
      details: error.message
    });
  }
});

module.exports = router;
