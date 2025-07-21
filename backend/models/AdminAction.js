const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User Management
      'farmer_approval',
      'farmer_rejection',
      'farmer_suspension',
      'customer_suspension',
      'user_verification',
      
      // Product Management
      'product_approval',
      'product_rejection',
      'product_suspension',
      'product_feature',
      'product_unfeature',
      
      // Order Management
      'order_status_update',
      'order_cancellation',
      'refund_approval',
      'refund_rejection',
      'dispute_resolution',
      
      // Pricing Management
      'price_update',
      'commission_update',
      'subsidy_update',
      
      // Quality Control
      'quality_check',
      'quality_flag',
      'quality_badge_assignment',
      
      // Communication
      'announcement_sent',
      'announcement_created', // Added for announcement creation
      'announcement_approved', // Added for announcement approval
      'announcement_updated', // Added for announcement update
      'notification_sent',
      'email_sent',
      
      // System Settings
      'category_update',
      'region_update',
      'setting_update',
      
      // Analytics
      'report_generated',
      'data_export',
      
      // Security
      'login_attempt',
      'password_change',
      'permission_update'
    ]
  },
  targetType: {
    type: String,
    enum: ['user', 'product', 'order', 'category', 'region', 'system', 'analytics'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Product', 'Order', 'Category', 'Region'],
    required: function() {
      return this.targetType !== 'system' && this.targetType !== 'analytics';
    }
  },
  details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    reason: String,
    notes: String
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
adminActionSchema.index({ admin: 1, timestamp: -1 });
adminActionSchema.index({ action: 1, timestamp: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ timestamp: -1 });

// Virtual for formatted action description
adminActionSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    farmer_approval: 'Approved farmer registration',
    farmer_rejection: 'Rejected farmer registration',
    product_approval: 'Approved product listing',
    product_rejection: 'Rejected product listing',
    order_status_update: 'Updated order status',
    refund_approval: 'Approved refund request',
    price_update: 'Updated product pricing',
    quality_check: 'Performed quality check',
    announcement_sent: 'Sent platform announcement'
  };
  
  return actionMap[this.action] || this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Static method to log admin action
adminActionSchema.statics.logAction = async function(actionData) {
  try {
    const action = new this(actionData);
    await action.save();
    return action;
  } catch (error) {
    console.error('Error logging admin action:', error);
    throw error;
  }
};

// Static method to get admin activity summary
adminActionSchema.statics.getActivitySummary = async function(adminId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        admin: mongoose.Types.ObjectId(adminId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastAction: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('AdminAction', adminActionSchema); 