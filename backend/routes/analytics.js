const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

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

// GET /api/analytics/sitewide-stats
router.get('/sitewide-stats', async (req, res) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const totalOrders = await Order.countDocuments({ status: { $in: ['delivered', 'completed'] } });

    res.json({
      success: true,
      data: {
        farmers: totalFarmers,
        products: activeProducts,
        orders: totalOrders,
      }
    });
  } catch (error) {
    console.error('Error fetching sitewide stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
