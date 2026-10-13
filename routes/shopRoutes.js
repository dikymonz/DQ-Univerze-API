const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: Mengambil semua item shop untuk publik
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM shop_items';
    let params = [];
    if (category && category !== 'All') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Shop Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

module.exports = router;