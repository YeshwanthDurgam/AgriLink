const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const AdminAction = require('../../models/AdminAction');
const roleCheck = require('../../middlewares/roleCheck');

// Get all farmers with filtering and pagination
router.get('/', roleCheck('super_admin', 'farmer_support'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      region,
      verificationStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { role: 'farmer' };

    // Apply filters
    if (status) {
      query.accountStatus = status;
    }
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }
    if (region) {
      query['farmAddress.state'] = region;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { farmName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: {
        path: 'stats',
        select: 'productsListed totalOrders averageRating monthlyRevenue'
      }
    };

    const farmers = await User.paginate(query, options);

    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmers',
      error: error.message
    });
  }
});

// Get farmer details by ID
router.get('/:id', roleCheck('super_admin', 'farmer_support'), async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id)
      .populate('stats')
      .select('-password -twoFactorSecret -backupCodes');

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Get farmer's products
    const products = await Product.find({ farmer: req.params.id })
      .select('name category status price quantity createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent orders
    const orders = await Order.find({
      'farmerOrders.farmer': req.params.id
    })
      .select('orderNumber orderStatus total createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get performance metrics
    const performanceMetrics = await getFarmerPerformanceMetrics(req.params.id);

    res.json({
      success: true,
      data: {
        farmer,
        products,
        orders,
        performanceMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmer details',
      error: error.message
    });
  }
});

// Approve farmer registration
router.post('/:id/approve', roleCheck('super_admin', 'farmer_support'), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const farmer = await User.findById(req.params.id);

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    if (farmer.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Farmer is already verified'
      });
    }

    // Update farmer status
    farmer.verificationStatus = 'verified';
    farmer.accountStatus = 'active';
    farmer.isVerified = true;
    await farmer.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'farmer_approval',
      targetType: 'user',
      targetId: farmer._id,
      targetModel: 'User',
      details: {
        reason,
        notes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Farmer approved successfully',
      data: {
        farmerId: farmer._id,
        verificationStatus: farmer.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving farmer',
      error: error.message
    });
  }
});

// Reject farmer registration
router.post('/:id/reject', roleCheck('super_admin', 'farmer_support'), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const farmer = await User.findById(req.params.id);

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Update farmer status
    farmer.verificationStatus = 'rejected';
    farmer.accountStatus = 'suspended';
    await farmer.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'farmer_rejection',
      targetType: 'user',
      targetId: farmer._id,
      targetModel: 'User',
      details: {
        reason,
        notes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Farmer rejected successfully',
      data: {
        farmerId: farmer._id,
        verificationStatus: farmer.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting farmer',
      error: error.message
    });
  }
});

// Suspend farmer account
router.post('/:id/suspend', roleCheck('super_admin'), async (req, res) => {
  try {
    const { reason, duration } = req.body;
    const farmer = await User.findById(req.params.id);

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Update farmer status
    farmer.accountStatus = 'suspended';
    await farmer.save();

    // Suspend all active products
    await Product.updateMany(
      { farmer: req.params.id, status: 'active' },
      { status: 'suspended' }
    );

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'farmer_suspension',
      targetType: 'user',
      targetId: farmer._id,
      targetModel: 'User',
      details: {
        reason,
        duration
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Farmer suspended successfully',
      data: {
        farmerId: farmer._id,
        accountStatus: farmer.accountStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error suspending farmer',
      error: error.message
    });
  }
});

// Reactivate farmer account
router.post('/:id/reactivate', roleCheck('super_admin'), async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id);

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Update farmer status
    farmer.accountStatus = 'active';
    await farmer.save();

    // Reactivate products that were suspended
    await Product.updateMany(
      { farmer: req.params.id, status: 'suspended' },
      { status: 'active' }
    );

    res.json({
      success: true,
      message: 'Farmer reactivated successfully',
      data: {
        farmerId: farmer._id,
        accountStatus: farmer.accountStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reactivating farmer',
      error: error.message
    });
  }
});

// Get farmer performance metrics
async function getFarmerPerformanceMetrics(farmerId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    monthlyOrders,
    totalRevenue,
    monthlyRevenue,
    averageRating,
    onTimeDeliveries
  ] = await Promise.all([
    Product.countDocuments({ farmer: farmerId }),
    Product.countDocuments({ farmer: farmerId, status: 'active' }),
    Order.countDocuments({ 'farmerOrders.farmer': farmerId }),
    Order.countDocuments({
      'farmerOrders.farmer': farmerId,
      createdAt: { $gte: thirtyDaysAgo }
    }),
    Order.aggregate([
      { $match: { 'farmerOrders.farmer': farmerId } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.aggregate([
      {
        $match: {
          'farmerOrders.farmer': farmerId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.findById(farmerId).select('stats.averageRating'),
    Order.countDocuments({
      'farmerOrders.farmer': farmerId,
      'farmerOrders.status': 'delivered',
      deliveredAt: { $lte: '$expectedDelivery' }
    })
  ]);

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    monthlyOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    averageRating: averageRating?.stats?.averageRating || 0,
    onTimeDeliveries,
    deliveryRate: totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0
  };
}

// Get regional farmer statistics
router.get('/stats/regional', roleCheck('super_admin', 'farmer_support'), async (req, res) => {
  try {
    const regionalStats = await User.aggregate([
      {
        $match: { role: 'farmer' }
      },
      {
        $group: {
          _id: '$farmAddress.state',
          totalFarmers: { $sum: 1 },
          verifiedFarmers: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          },
          activeFarmers: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] }
          },
          totalProducts: { $sum: '$stats.productsListed' },
          totalRevenue: { $sum: '$stats.totalRevenue' }
        }
      },
      {
        $sort: { totalFarmers: -1 }
      }
    ]);

    res.json({
      success: true,
      data: regionalStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching regional statistics',
      error: error.message
    });
  }
});

module.exports = router; 