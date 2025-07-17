const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const User = require('../../models/User');
const AdminAction = require('../../models/AdminAction');
const roleCheck = require('../../middlewares/roleCheck');
const QualityFlag = require('../../models/QualityFlag');
const mongoose = require('mongoose');

// Get all products with filtering and pagination
router.get('/', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      farmer,
      region,
      organic,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (farmer) {
      query.farmer = farmer;
    }
    if (region) {
      query['farmAddress.state'] = region;
    }
    if (organic !== undefined) {
      query.organic = organic === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { farmName: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: {
        path: 'farmer',
        select: 'name farmName farmLocation verificationStatus'
      }
    };

    const products = await Product.paginate(query, options);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Get pending products for approval
router.get('/pending', roleCheck('admin', 'produce_manager', 'admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      farmer
    } = req.query;

    const query = {
      status: 'pending_approval',
      'approvalStatus.status': 'pending'
    };

    if (category) {
      query.category = category;
    }
    if (farmer) {
      query.farmer = farmer;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: 1 },
      populate: {
        path: 'farmer',
        select: 'name farmName verificationStatus'
      }
    };

    const pendingProducts = await Product.paginate(query, options);

    res.json({
      success: true,
      data: pendingProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending products',
      error: error.message
    });
  }
});

// Get product details by ID
router.get('/:id', roleCheck('admin', 'produce_manager', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name farmName farmLocation verificationStatus phone email')
      .populate('qualityChecks.checkedBy', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get similar products from same farmer
    const similarProducts = await Product.find({
      farmer: product.farmer._id,
      _id: { $ne: product._id },
      status: 'active'
    })
      .select('name category price unit quantity')
      .limit(5);

    res.json({
      success: true,
      data: {
        product,
        similarProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message
    });
  }
});

// Approve product
router.post('/:id/approve', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    console.log('APPROVE ROUTE: user:', req.user, 'body:', req.body, 'params:', req.params);
    const { notes, qualityScore } = req.body;
    const product = await Product.findById(req.params.id);
    console.log('PRODUCT:', product);

    if (!product) {
      console.log('PRODUCT NOT FOUND');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'pending_approval') {
      console.log('PRODUCT NOT PENDING APPROVAL');
      return res.status(400).json({
        success: false,
        message: 'Product is not pending approval'
      });
    }

    // Update product status
    product.status = 'active';
    product.approvalStatus = {
      status: 'approved',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      notes
    };

    if (qualityScore) {
      product.qualityScore = qualityScore;
    }

    await product.save();
    console.log('PRODUCT APPROVED AND SAVED');

    // Update farmer stats
    await User.findByIdAndUpdate(product.farmer, {
      $inc: { 'stats.productsListed': 1 }
    });
    console.log('FARMER STATS UPDATED');

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'product_approval',
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: {
        notes,
        qualityScore
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    console.log('ADMIN ACTION LOGGED');

    res.json({
      success: true,
      message: 'Product approved successfully',
      data: {
        productId: product._id,
        status: product.status
      }
    });
  } catch (err) {
    console.error('Approve product error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reject product
router.post('/:id/reject', roleCheck('admin', 'produce_manager', 'admin'), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product status
    product.status = 'rejected';
    product.approvalStatus = {
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
      notes
    };

    await product.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'product_rejection',
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: {
        reason,
        notes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Product rejected successfully',
      data: {
        productId: product._id,
        status: product.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting product',
      error: error.message
    });
  }
});

// Suspend product
router.post('/:id/suspend', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousStatus = product.status;
    product.status = 'suspended';

    await product.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'product_suspension',
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: {
        reason,
        previousStatus
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Product suspended successfully',
      data: {
        productId: product._id,
        status: product.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error suspending product',
      error: error.message
    });
  }
});

// Feature/unfeature product
router.post('/:id/feature', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const { featured } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isFeatured = featured;
    await product.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: featured ? 'product_feature' : 'product_unfeature',
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: { featured },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        productId: product._id,
        isFeatured: product.isFeatured
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product feature status',
      error: error.message
    });
  }
});

// Update product pricing
router.put('/:id/pricing', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const { basePrice, regionalPricing, commissionRate } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousPricing = {
      basePrice: product.basePrice,
      regionalPricing: product.regionalPricing,
      commissionRate: product.commissionRate
    };

    // Update pricing
    if (basePrice !== undefined) product.basePrice = basePrice;
    if (regionalPricing) product.regionalPricing = regionalPricing;
    if (commissionRate !== undefined) product.commissionRate = commissionRate;

    await product.save();

    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'price_update',
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: {
        before: previousPricing,
        after: {
          basePrice: product.basePrice,
          regionalPricing: product.regionalPricing,
          commissionRate: product.commissionRate
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Product pricing updated successfully',
      data: {
        productId: product._id,
        basePrice: product.basePrice,
        regionalPricing: product.regionalPricing,
        commissionRate: product.commissionRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product pricing',
      error: error.message
    });
  }
});

// Get inventory statistics
router.get('/stats/inventory', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const inventoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalQuantity: { $sum: '$quantity' },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$quantity', '$lowStockThreshold'] },
                1,
                0
              ]
            }
          },
          averagePrice: { $avg: '$basePrice' }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);

    // Get overall statistics
    const overallStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          pendingApproval: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] }
          },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          suspendedProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          },
          totalValue: { $sum: { $multiply: ['$basePrice', '$quantity'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        categoryStats: inventoryStats,
        overallStats: overallStats[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics',
      error: error.message
    });
  }
});

// Get seasonal availability statistics
router.get('/stats/seasonal', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    
    const seasonalStats = await Product.aggregate([
      {
        $match: {
          seasonalAvailability: true,
          $or: [
            {
              $and: [
                { 'cropSeason.startMonth': { $lte: currentMonth } },
                { 'cropSeason.endMonth': { $gte: currentMonth } }
              ]
            },
            {
              $and: [
                { 'cropSeason.startMonth': { $gt: 'cropSeason.endMonth' } },
                {
                  $or: [
                    { 'cropSeason.startMonth': { $lte: currentMonth } },
                    { 'cropSeason.endMonth': { $gte: currentMonth } }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        $group: {
          _id: '$category',
          availableProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$basePrice' }
        }
      },
      {
        $sort: { availableProducts: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        currentMonth,
        seasonalStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching seasonal statistics',
      error: error.message
    });
  }
});

// 1. Get lifecycle/quality event history for a product
router.get('/:id/lifecycle-events', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const productId = req.params.id;
    // Get admin actions related to this product
    const adminActions = await AdminAction.find({
      targetType: 'product',
      targetId: productId
    }).sort({ timestamp: -1 });
    // Get quality flags for this product
    const qualityFlags = await QualityFlag.find({ product: productId }).sort({ createdAt: -1 });
    // Get product status/quality changes (from product doc)
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      data: {
        adminActions,
        qualityFlags,
        productStatus: product.status,
        approvalStatus: product.approvalStatus,
        qualityScore: product.qualityScore,
        qualityChecks: product.qualityChecks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching lifecycle events', error: error.message });
  }
});

// 2. Update product status (suspend, out_of_stock, etc.)
router.post('/:id/status', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const { status, reason, notes } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const oldStatus = product.status;
    product.status = status;
    await product.save();
    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'product_' + status,
      targetType: 'product',
      targetId: product._id,
      targetModel: 'Product',
      details: { before: { status: oldStatus }, after: { status }, reason, notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      location: req.user.location || '',
      status: 'success'
    });
    res.json({ success: true, message: 'Product status updated', data: { oldStatus, newStatus: status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating product status', error: error.message });
  }
});

// 3. List all quality flags for a product
router.get('/:id/quality-flags', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const productId = req.params.id;
    const flags = await QualityFlag.find({ product: productId }).populate('reportedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching quality flags', error: error.message });
  }
});

// 4. Create a new quality flag for a product
router.post('/:id/quality-flag', roleCheck('admin', 'produce_manager'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { flagType, severity, description, evidence } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const flag = new QualityFlag({
      product: productId,
      farmer: product.farmer,
      reportedBy: req.user.id,
      flagType,
      severity,
      description,
      evidence
    });
    await flag.save();
    // Log admin action
    await AdminAction.logAction({
      admin: req.user.id,
      action: 'quality_flag',
      targetType: 'product',
      targetId: productId,
      targetModel: 'Product',
      details: { flagType, severity, description },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      location: req.user.location || '',
      status: 'success'
    });
    res.status(201).json({ success: true, message: 'Quality flag created', data: flag });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating quality flag', error: error.message });
  }
});

module.exports = router; 