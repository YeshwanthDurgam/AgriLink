const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const roleCheck = require('../../middlewares/roleCheck');
const User = require('../../models/User');
const QualityFlag = require('../../models/QualityFlag');
const Announcement = require('../../models/Announcement');
const AdminAction = require('../../models/AdminAction');
const mongoose = require('mongoose');

// Placeholder for analytics routes
// Will be implemented in Phase 3

router.get('/', (req, res) => {
  res.json({ message: 'Analytics routes - to be implemented in Phase 3' });
});

// 1. Aggregate products by crop season
router.get('/crop-seasons', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const seasons = await Product.aggregate([
      {
        $group: {
          _id: {
            startMonth: '$cropSeason.startMonth',
            endMonth: '$cropSeason.endMonth'
          },
          products: { $push: { name: '$name', category: '$category', farmer: '$farmer', region: '$farmLocation' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.startMonth': 1 } }
    ]);
    res.json({ success: true, data: seasons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching crop seasons', error: error.message });
  }
});

// 2. Generate analytics for a given crop season and region
router.get('/season-report', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const { startMonth, endMonth, region } = req.query;
    const match = {};
    if (startMonth && endMonth) {
      match['cropSeason.startMonth'] = parseInt(startMonth);
      match['cropSeason.endMonth'] = parseInt(endMonth);
    }
    if (region) {
      match['farmLocation'] = region;
    }
    const products = await Product.find(match, 'name category quantity basePrice regionalPricing qualityScore');
    // Optionally, aggregate order stats for these products
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating season report', error: error.message });
  }
});

// 3. List top products by sales or rating
router.get('/top-products', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const { sortBy = 'orders', limit = 10 } = req.query;
    const products = await Product.find()
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching top products', error: error.message });
  }
});

// 4. Get comprehensive dashboard statistics
router.get('/dashboard-stats', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const pendingProducts = await Product.countDocuments({ status: 'pending_approval' });

    // Order statistics (assuming Order model exists)
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: lastMonth } });
    const ordersThisWeek = await Order.countDocuments({ createdAt: { $gte: lastWeek } });

    // Quality flags
    const totalQualityFlags = await QualityFlag.countDocuments();
    const pendingQualityFlags = await QualityFlag.countDocuments({ status: 'pending' });

    // Announcements
    const totalAnnouncements = await Announcement.countDocuments();
    const activeAnnouncements = await Announcement.countDocuments({ status: 'active' });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          farmers: totalFarmers,
          buyers: totalBuyers,
          newThisMonth: newUsersThisMonth
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          pending: pendingProducts
        },
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          thisWeek: ordersThisWeek
        },
        quality: {
          totalFlags: totalQualityFlags,
          pendingFlags: pendingQualityFlags
        },
        announcements: {
          total: totalAnnouncements,
          active: activeAnnouncements
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// 5. Get system health metrics
router.get('/system-health', roleCheck('admin'), async (req, res) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Recent admin actions
    const recentActions = await AdminAction.countDocuments({ timestamp: { $gte: lastHour } });

    // System errors (failed admin actions)
    const recentErrors = await AdminAction.countDocuments({
      timestamp: { $gte: lastHour },
      status: 'failed'
    });

    // Database connection status (basic check)
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Memory usage (if available)
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          connectionState: mongoose.connection.readyState
        },
        performance: {
          recentActions,
          recentErrors,
          errorRate: recentActions > 0 ? (recentErrors / recentActions * 100).toFixed(2) : 0
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
        },
        uptime: {
          process: Math.round(process.uptime()), // seconds
          server: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system health',
      error: error.message
    });
  }
});

// 6. Get user activity analytics
router.get('/user-activity', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // User registrations over time
    const userRegistrations = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User activity by role
    const userActivityByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgRating: { $avg: '$stats.averageRating' },
          totalOrders: { $sum: '$stats.ordersPlaced' }
        }
      }
    ]);

    // Recent admin actions
    const recentAdminActions = await AdminAction.aggregate([
      {
        $match: { timestamp: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        userRegistrations,
        userActivityByRole,
        recentAdminActions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity',
      error: error.message
    });
  }
});

// 7. Get revenue and financial analytics
router.get('/revenue-analytics', roleCheck('admin', 'analytics_manager'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue from orders
    const revenueData = await Order.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top earning farmers
    const topFarmers = await Order.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$farmer',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      {
        $unwind: '$farmer'
      },
      {
        $project: {
          farmerName: '$farmer.name',
          farmName: '$farmer.farmName',
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Product performance
    const topProducts = await Order.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        revenueData,
        topFarmers,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error.message
    });
  }
});

module.exports = router; 