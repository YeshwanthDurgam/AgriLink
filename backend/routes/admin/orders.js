const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const User = require('../../models/User');
const AdminAction = require('../../models/AdminAction');
// const roleCheck = require('../../middlewares/roleCheck');

// List all orders with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      region,
      farmer,
      buyer,
      deliveryPartner,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.orderStatus = status;
    if (region) query.region = region;
    if (farmer) query['farmerOrders.farmer'] = farmer;
    if (buyer) query.buyer = buyer;
    if (deliveryPartner) query['deliveryPartner.partnerId'] = deliveryPartner;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'buyer', select: 'name email phone' },
        { path: 'farmerOrders.farmer', select: 'name farmName' }
      ]
    };

    const orders = await Order.paginate ? await Order.paginate(query, options) : await Order.find(query).sort(options.sort).limit(options.limit).skip((options.page-1)*options.limit).populate(options.populate);

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
});

// Get order details by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone')
      .populate('farmerOrders.farmer', 'name farmName')
      .populate('items.product', 'name category')
      .populate('disputes.resolution.resolvedBy', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order details', error: error.message });
  }
});

// Update order status (admin override)
router.post('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const prevStatus = order.orderStatus;
    order.orderStatus = status;
    order.lifecycle.push({ stage: status, notes, updatedBy: req.user ? req.user.id : null });
    await order.save();
    if (AdminAction && req.user) {
      await AdminAction.logAction({
        admin: req.user.id,
        action: 'order_status_update',
        targetType: 'order',
        targetId: order._id,
        targetModel: 'Order',
        details: { prevStatus, newStatus: status, notes },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    res.json({ success: true, message: 'Order status updated', data: { orderId: order._id, orderStatus: order.orderStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
});

// Assign/reassign delivery partner
router.post('/:id/delivery-partner', async (req, res) => {
  try {
    const { partnerId, partnerName, contactNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.deliveryPartner = { partnerId, partnerName, contactNumber, estimatedDelivery };
    await order.save();
    if (AdminAction && req.user) {
      await AdminAction.logAction({
        admin: req.user.id,
        action: 'logistics_management',
        targetType: 'order',
        targetId: order._id,
        targetModel: 'Order',
        details: { partnerId, partnerName },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    res.json({ success: true, message: 'Delivery partner assigned', data: { orderId: order._id, deliveryPartner: order.deliveryPartner } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning delivery partner', error: error.message });
  }
});

// Handle disputes (mark as resolved, refund, etc.)
router.post('/:id/dispute/:disputeId/resolve', async (req, res) => {
  try {
    const { action, amount, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const dispute = order.disputes.id(req.params.disputeId);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }
    dispute.status = 'resolved';
    dispute.resolution = {
      action,
      amount,
      notes,
      resolvedBy: req.user ? req.user.id : null,
      resolvedAt: new Date()
    };
    await order.save();
    if (AdminAction && req.user) {
      await AdminAction.logAction({
        admin: req.user.id,
        action: 'dispute_resolution',
        targetType: 'order',
        targetId: order._id,
        targetModel: 'Order',
        details: { disputeId: dispute._id, action, amount, notes },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    res.json({ success: true, message: 'Dispute resolved', data: { orderId: order._id, dispute } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resolving dispute', error: error.message });
  }
});

// Region-wise order stats
router.get('/stats/region', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$region',
          totalOrders: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] } },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching region stats', error: error.message });
  }
});

// Admin order stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const delivered = await Order.countDocuments({ orderStatus: 'delivered' });
    const disputes = await Order.countDocuments({ 'disputes.status': 'open' });
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    res.json({ success: true, data: { total, delivered, disputes, totalRevenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router; 