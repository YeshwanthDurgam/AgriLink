const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: [
      'general',
      'price_update',
      'crop_ban',
      'harvest_schedule',
      'subsidy_announcement',
      'weather_alert',
      'quality_update',
      'system_maintenance',
      'policy_change',
      'emergency',
      'carousel' // Added carousel type
    ],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: [String],
    enum: ['all', 'farmers', 'buyers', 'admins'],
    default: ['all']
  },
  targetRegions: [{
    type: String,
    trim: true
  }],
  targetCategories: [{
    type: String,
    enum: ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'admin_only'],
    default: 'public'
  },
  schedule: {
    publishAt: {
      type: Date,
      default: Date.now
    },
    expireAt: {
      type: Date
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  delivery: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video']
    },
    url: String,
    name: String,
    size: Number
  }],
  image: {
    type: String,
    required: function() { return this.type === 'carousel'; },
  },
  targetUrl: {
    type: String,
    required: function() { return this.type === 'carousel'; },
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  deliveryStats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  engagement: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    responses: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
announcementSchema.index({ status: 1, 'schedule.publishAt': 1 });
// Removed compound index on targetRegions and targetAudience to avoid parallel arrays error
announcementSchema.index({ type: 1, priority: 1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ tags: 1 });

// Virtual for announcement status
announcementSchema.virtual('isActive').get(function() {
  const now = new Date();
  const publishAt = this.schedule.publishAt;
  const expireAt = this.schedule.expireAt;
  
  if (this.status !== 'active') return false;
  if (now < publishAt) return false;
  if (expireAt && now > expireAt) return false;
  
  return true;
});

// Virtual for time until expiry
announcementSchema.virtual('timeUntilExpiry').get(function() {
  if (!this.schedule.expireAt) return null;
  
  const now = new Date();
  const expiry = this.schedule.expireAt;
  const diff = expiry - now;
  
  if (diff <= 0) return 'expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days, ${hours} hours`;
  return `${hours} hours`;
});

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = async function(userRole, userRegion) {
  const now = new Date();
  
  const query = {
    status: 'active',
    'schedule.publishAt': { $lte: now },
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userRole }
    ]
  };
  
  // Add region filter if specified
  if (userRegion) {
    query.$or.push({ targetRegions: userRegion });
  }
  
  // Add expiry filter
  query.$or.push({
    $or: [
      { 'schedule.expireAt': { $exists: false } },
      { 'schedule.expireAt': { $gt: now } }
    ]
  });
  
  return await this.find(query)
    .sort({ priority: -1, 'schedule.publishAt': -1 })
    .populate('createdBy', 'name')
    .limit(10);
};

// Static method to get announcement statistics
announcementSchema.statics.getAnnouncementStats = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalViews: { $sum: '$engagement.views' },
        totalShares: { $sum: '$engagement.shares' }
      }
    },
    {
      $sort: { '_id.type': 1, '_id.status': 1 }
    }
  ]);
};

// Static method to get delivery performance
announcementSchema.statics.getDeliveryPerformance = async function(announcementId) {
  const announcement = await this.findById(announcementId);
  if (!announcement) return null;
  
  const stats = announcement.deliveryStats;
  const total = stats.totalRecipients;
  
  if (total === 0) return {
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    failureRate: 0
  };
  
  return {
    deliveryRate: (stats.delivered / total) * 100,
    openRate: (stats.opened / total) * 100,
    clickRate: (stats.clicked / total) * 100,
    failureRate: (stats.failed / total) * 100
  };
};

// Pre-save middleware to update status based on schedule
announcementSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'scheduled' && this.schedule.publishAt <= now) {
    this.status = 'active';
  }
  
  if (this.status === 'active' && this.schedule.expireAt && this.schedule.expireAt <= now) {
    this.status = 'expired';
  }
  
  this.updatedAt = now;
  next();
});

// Add a schema-level validation for carousel type
// Ensure image and targetUrl are present for carousel type
announcementSchema.pre('validate', function(next) {
  if (this.type === 'carousel') {
    if (!this.image) {
      this.invalidate('image', 'Image is required for carousel announcements');
    }
    if (!this.targetUrl) {
      this.invalidate('targetUrl', 'Target URL is required for carousel announcements');
    }
  }
  next();
});

announcementSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Announcement', announcementSchema); 