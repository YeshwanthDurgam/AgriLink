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

// Facets with current filters
// GET /api/analytics/facets
router.get('/facets', async (req, res) => {
  try {
    const {
      category,
      location,
      organic,
      minPrice,
      maxPrice,
      search
    } = req.query;

    const match = { status: 'active' };
    if (category) match.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (organic !== undefined) match.organic = organic === 'true';
    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = parseFloat(minPrice);
      if (maxPrice) match.price.$lte = parseFloat(maxPrice);
    }
    if (search) match.$text = { $search: search };

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'farmer', foreignField: '_id', as: 'farmerDoc' } },
      { $unwind: { path: '$farmerDoc', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          categories: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { _id: 0, value: '$_id', count: 1 } },
            { $sort: { count: -1 } }
          ],
          locations: [
            { $group: { _id: '$farmerDoc.location', count: { $sum: 1 } } },
            { $project: { _id: 0, value: '$_id', count: 1 } },
            { $sort: { count: -1 } }
          ],
          organic: [
            { $group: { _id: '$organic', count: { $sum: 1 } } },
            { $project: { _id: 0, value: '$_id', count: 1 } }
          ],
          availability: [
            { $group: { _id: { $cond: [{ $gt: ['$quantity', 0] }, 'in_stock', 'out_of_stock'] }, count: { $sum: 1 } } },
            { $project: { _id: 0, value: '$_id', count: 1 } }
          ]
        }
      }
    ];

    const [result] = await Product.aggregate(pipeline);
    res.json({ success: true, facets: result });
  } catch (error) {
    console.error('Error fetching facets:', error);
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
