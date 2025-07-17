const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// Import admin route modules
const farmerRoutes = require('./admin/farmers');
const customerRoutes = require('./admin/customers');
const produceRoutes = require('./admin/produce');
const orderRoutes = require('./admin/orders');
const analyticsRoutes = require('./admin/analytics');
const pricingRoutes = require('./admin/pricing');
const moderationRoutes = require('./admin/moderation');
const communicationRoutes = require('./admin/communication');
const transactionRoutes = require('./admin/transactions');
const alertRoutes = require('./admin/alerts');
const settingsRoutes = require('./admin/settings');

// Admin authentication middleware
const adminAuth = [auth, roleCheck('admin', 'produce_manager', 'logistics_coordinator', 'farmer_support')];

// Dashboard overview route
router.get('/dashboard-stats', adminAuth, async (req, res) => {
  try {
    // This will be implemented in the analytics controller
    res.json({ message: 'Dashboard stats endpoint - to be implemented' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Health check for admin system
router.get('/health', adminAuth, (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    admin: {
      id: req.user.id,
      role: req.user.role,
      permissions: req.user.adminPermissions
    }
  });
});

// Mount admin route modules
router.use('/farmers', adminAuth, farmerRoutes);
router.use('/customers', adminAuth, customerRoutes);
router.use('/produce', adminAuth, produceRoutes);
router.use('/orders', adminAuth, orderRoutes);
router.use('/analytics', adminAuth, analyticsRoutes);
router.use('/pricing', adminAuth, pricingRoutes);
router.use('/moderation', adminAuth, moderationRoutes);
router.use('/communication', adminAuth, communicationRoutes);
router.use('/transactions', adminAuth, transactionRoutes);
router.use('/alerts', adminAuth, alertRoutes);
router.use('/settings', adminAuth, settingsRoutes);

module.exports = router; 