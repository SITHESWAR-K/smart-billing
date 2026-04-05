const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/supabase');

const PERIODS = ['daily', 'monthly', 'yearly'];

const buildPeriodKey = (date, period) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (period === 'yearly') return `${year}`;
  if (period === 'monthly') return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const getDateRange = (period, from, to) => {
  const now = new Date();
  const end = to ? new Date(to) : now;
  const start = from ? new Date(from) : new Date(end);

  if (!from) {
    if (period === 'yearly') {
      start.setFullYear(end.getFullYear() - 4, 0, 1);
    } else if (period === 'monthly') {
      start.setMonth(end.getMonth() - 11, 1);
    } else {
      start.setDate(end.getDate() - 29);
    }
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

router.get('/:shop_id', async (req, res) => {
  try {
    const shop_id = req.params.shop_id.trim().toUpperCase();
    const period = (req.query.period || 'daily').toLowerCase();

    if (!PERIODS.includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use daily, monthly, or yearly.' });
    }

    const { start, end } = getDateRange(period, req.query.from, req.query.to);

    const supabase = getDatabase();
    const { data: bills, error } = await supabase
      .from('bills')
      .select('id, items, total, created_at')
      .eq('shop_id', shop_id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const grouped = new Map();
    let totalSales = 0;
    let totalBills = 0;
    let totalItemsSold = 0;

    for (const bill of bills || []) {
      const billDate = new Date(bill.created_at);
      const key = buildPeriodKey(billDate, period);
      const billTotal = Number(bill.total) || 0;

      const parsedItems = Array.isArray(bill.items) ? bill.items : [];
      const billItemsSold = parsedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          total_sales: 0,
          bills_count: 0,
          items_sold: 0
        });
      }

      const current = grouped.get(key);
      current.total_sales += billTotal;
      current.bills_count += 1;
      current.items_sold += billItemsSold;

      totalSales += billTotal;
      totalBills += 1;
      totalItemsSold += billItemsSold;
    }

    const data = Array.from(grouped.values())
      .sort((a, b) => (a.period < b.period ? 1 : -1))
      .map(item => ({
        ...item,
        average_bill_value: item.bills_count > 0 ? Number((item.total_sales / item.bills_count).toFixed(2)) : 0,
        total_sales: Number(item.total_sales.toFixed(2))
      }));

    res.json({
      period,
      from: start.toISOString(),
      to: end.toISOString(),
      summary: {
        total_sales: Number(totalSales.toFixed(2)),
        total_bills: totalBills,
        total_items_sold: totalItemsSold,
        average_bill_value: totalBills > 0 ? Number((totalSales / totalBills).toFixed(2)) : 0
      },
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve reports', details: error.message });
  }
});

module.exports = router;
