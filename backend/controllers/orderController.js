const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Address = require('../models/Address');
const mongoose = require('mongoose');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      notes
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Process items and validate stock
    const processedItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const product = await Product.findById(cartItem.id || cartItem.product);
      if (!product) {
        console.error('Product not found for cartItem:', cartItem);
        return res.status(404).json({
          success: false,
          message: `Product ${cartItem.id || cartItem.product} not found`
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available for purchase`
        });
      }

      if (product.quantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}`
        });
      }

      const itemTotal = product.basePrice * cartItem.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        price: product.basePrice, // Always use basePrice
        unit: product.unit,
        quantity: cartItem.quantity,
        total: product.basePrice * cartItem.quantity, // Always use basePrice
        farmer: product.farmer,
        farmerName: product.farmerName || 'Unknown Farmer'
      });
    }

    // Calculate delivery fee (free for orders above ₹500)
    const deliveryFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + deliveryFee;

    // Create the order
    const order = new Order({
      buyer: req.user.id,
      items: processedItems,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      subtotal,
      deliveryFee,
      total,
      notes,
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      region: deliveryAddress.state // Add region field for Order schema
    });

    await order.save();

    // Update product quantities
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Save delivery address to user's saved addresses if it doesn't already exist
    try {
      const existingAddress = await Address.findOne({
        userId: req.user.id,
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        address: deliveryAddress.address,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
        isActive: true
      });

      if (!existingAddress) {
        // Check if user has any addresses
        const addressCount = await Address.countDocuments({
          userId: req.user.id,
          isActive: true
        });

        // Create new address
        const newAddress = new Address({
          userId: req.user.id,
          fullName: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          address: deliveryAddress.address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
          landmark: deliveryAddress.landmark || '',
          latitude: deliveryAddress.latitude,
          longitude: deliveryAddress.longitude,
          addressType: 'home', // Default to home
          isDefault: addressCount === 0, // Set as default if this is the first address
          isActive: true
        });

        await newAddress.save();
        console.log('Delivery address saved to user addresses:', newAddress._id);
      }
    } catch (addressError) {
      // Log the error but don't fail the order creation
      console.error('Error saving delivery address:', addressError);
    }

    // Populate order details
    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'items.product', select: 'name images' },
      { path: 'farmerOrders.farmer', select: 'name phone location' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { buyer: req.user.id };
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate([
        { path: 'items.product', select: 'name images' },
        { path: 'farmerOrders.farmer', select: 'name phone location' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'items.product', select: 'name images description' },
        { path: 'farmerOrders.farmer', select: 'name phone location farmName' }
      ])
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.buyer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status (for farmers and admins)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, trackingNumber, trackingUrl } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    const isFarmer = req.user.role === 'farmer';
    const isAdmin = req.user.role === 'admin';
    const isBuyer = order.buyer.toString() === req.user.id;

    if (!isFarmer && !isAdmin && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update order status
    const updateData = { orderStatus: status };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason;
    }

    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'items.product', select: 'name images' },
      { path: 'farmerOrders.farmer', select: 'name phone location' }
    ]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user can cancel the order
    if (order.buyer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Get farmer's orders
const getFarmerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const farmerId = req.user.id;
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID provided.'
      });
    }
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

    const baseMatch = { 'farmerOrders.farmer': farmerObjectId };
    if (status && status !== 'all') {
      baseMatch['farmerOrders.status'] = status;
    }

    // Pipeline to fetch orders
    const ordersPipeline = [
      { $match: baseMatch },
      { $unwind: { path: '$farmerOrders', preserveNullAndEmptyArrays: true } },
      { $match: { 'farmerOrders.farmer': farmerId } }, // Ensure we only process the current farmer's sub-order
      { $addFields: { farmerSpecificOrderStatus: '$farmerOrders.status' } }, // Promote farmer's status
      { $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyerInfo'
      }},
      { $unwind: { path: '$buyerInfo', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      { $match: { 'items.farmer': farmerId } }, // Only include items from this farmer
      { $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'items.productInfo'
      }},
      { $unwind: { path: '$items.productInfo', preserveNullAndEmptyArrays: true } }, // Preserve documents if productInfo is missing
      { $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          createdAt: { $first: '$createdAt' },
          deliveryAddress: { $first: '$deliveryAddress' },
          paymentMethod: { $first: '$paymentMethod' },
          subtotal: { $first: '$subtotal' },
          deliveryFee: { $first: '$deliveryFee' },
          total: { $first: '$total' },
          notes: { $first: '$notes' },
          expectedDelivery: { $first: '$expectedDelivery' },
          orderStatus: { $first: '$farmerSpecificOrderStatus' }, // Use the promoted status
          buyer: { $first: '$buyerInfo' }, // Now buyerInfo is populated
          items: { $push: {
              product: '$items.productInfo',
              name: '$items.name',
              price: '$items.price',
              unit: '$items.unit',
              quantity: '$items.quantity',
              total: '$items.total',
              farmer: '$items.farmer',
              farmerName: '$items.farmerName'
          }}
      }},
      { $project: {
          _id: 1,
          orderNumber: 1,
          createdAt: 1,
          deliveryAddress: 1,
          paymentMethod: 1,
          subtotal: 1,
          deliveryFee: 1,
          total: 1,
          notes: 1,
          expectedDelivery: 1,
          orderStatus: 1,
          items: 1,
          buyer: { $cond: { if: "$buyerInfo", then: { _id: '$buyerInfo._id', name: '$buyerInfo.name', email: '$buyerInfo.email', phone: '$buyerInfo.phone' }, else: null } } // Access populated buyer fields
      }},
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const orders = await Order.aggregate(ordersPipeline);

    // Pipeline to count total documents for pagination
    const countPipeline = [
      { $match: baseMatch },
      { $unwind: '$farmerOrders' },
      { $match: { 'farmerOrders.farmer': farmerId } },
      { $count: 'total' }
    ];

    const totalResult = await Order.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      orders: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Update farmer order status
const updateFarmerOrderStatus = async (req, res) => {
  try {
    const { orderId, farmerOrderId } = req.params;
    const { status, trackingNumber, trackingUrl } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Find the specific farmer order
    const farmerOrder = order.farmerOrders.id(farmerOrderId);
    if (!farmerOrder) {
      return res.status(404).json({
        success: false,
        message: 'Farmer order not found'
      });
    }

    // Check if the farmer owns this order
    if (farmerOrder.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update farmer order status
    farmerOrder.status = status;
    if (status === 'delivered') {
      farmerOrder.deliveredAt = new Date();
    }

    // Update main order status if all farmer orders are delivered
    const allDelivered = order.farmerOrders.every(fo => fo.status === 'delivered');
    if (allDelivered) {
      order.orderStatus = 'delivered';
      order.deliveredAt = new Date();
    }

    // Update tracking info
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    await order.save();

    res.json({
      success: true,
      message: 'Farmer order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating farmer order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating farmer order status',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getFarmerOrders,
  updateFarmerOrderStatus
}; 