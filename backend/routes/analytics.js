const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/analytics/category-counts
router.get('/category-counts', async (req, res) => {
  try {
    const categoryCounts = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } }
    ]);
    res.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching category counts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
