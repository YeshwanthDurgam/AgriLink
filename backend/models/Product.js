const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 50
  },
  variety: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Enhanced Pricing and Units
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  regionalPricing: [{
    region: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  }],
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gram', 'piece', 'dozen', 'box', 'bunch', 'liter', 'pack', 'quintal', 'ton']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 0
  },
  maxOrderQuantity: {
    type: Number,
    min: 0
  },

  // Enhanced Inventory Management
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },

  // Agricultural Specific Information
  cropSeason: {
    startMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    endMonth: {
      type: Number,
      min: 1,
      max: 12
    }
  },
  seasonalAvailability: {
    type: Boolean,
    default: false
  },
  harvestDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  shelfLife: {
    type: Number, // in days
    min: 1
  },
  storageRequirements: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    humidity: {
      min: Number,
      max: Number
    },
    specialConditions: String
  },

  // Enhanced Product Quality & Certification
  organic: {
    type: Boolean,
    default: false
  },
  certifications: [{
    type: String,
    enum: ['Organic', 'GAP', 'HACCP', 'ISO', 'FSSAI', 'Fair Trade', 'Rainforest Alliance', 'Other']
  }],
  qualityGrade: {
    type: String,
    enum: ['Premium', 'Grade A', 'Grade B', 'Standard'],
    default: 'Standard'
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 5
  },
  qualityChecks: [{
    checkType: {
      type: String,
      enum: ['visual', 'weight', 'freshness', 'pesticide', 'other']
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'pending']
    },
    notes: String,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Images and Media
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: String,
    title: String,
    description: String,
    duration: Number
  }],

  // Enhanced Farmer Information
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  farmLocation: {
    type: String,
    trim: true,
    maxlength: 200
  },
  farmCoordinates: {
    latitude: Number,
    longitude: Number
  },

  // Enhanced Location & Delivery
  availableRegions: [{
    type: String,
    trim: true
  }],
  deliveryRadius: {
    type: Number, // in kilometers
    default: 50
  },
  deliveryTime: {
    type: Number, // in hours
    default: 24
  },
  deliveryPartners: [{
    partnerId: String,
    partnerName: String,
    cost: Number,
    estimatedTime: Number
  }],

  // Enhanced Status & Visibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'pending_approval', 'rejected', 'suspended'],
    default: 'pending_approval'
  },
  approvalStatus: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String,
    notes: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSeasonal: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'region_limited'],
    default: 'public'
  },

  // Enhanced SEO & Discovery
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  searchKeywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  cropType: {
    type: String,
    enum: ['annual', 'perennial', 'seasonal', 'year_round']
  },

  // Enhanced Statistics
  views: {
    type: Number,
    default: 0
  },
  orders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  returnRate: {
    type: Number,
    default: 0
  },
  qualityIssues: {
    type: Number,
    default: 0
  },

  // Commission and Pricing
  commissionRate: {
    type: Number,
    default: 5, // percentage
    min: 0,
    max: 100
  },
  subsidyAmount: {
    type: Number,
    default: 0
  },
  subsidyType: {
    type: String,
    enum: ['government', 'platform', 'none'],
    default: 'none'
  },

  // Product ownership and representation
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  representative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Timestamps
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
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ farmer: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ harvestDate: 1 });
productSchema.index({ 'farmer.location': 1 });

// Virtual for available quantity
productSchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.quantity - this.reservedQuantity);
});

// Virtual for isInStock
productSchema.virtual('isInStock').get(function() {
  return this.availableQuantity > 0 && this.status === 'active';
});

// Pre-save middleware to update timestamps
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active products
productSchema.statics.findActive = function() {
  return this.find({ status: 'active', quantity: { $gt: 0 } });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    if (this.quantity >= quantity) {
      this.quantity -= quantity;
      return true;
    }
    return false;
  } else if (operation === 'increase') {
    this.quantity += quantity;
    return true;
  }
  return false;
};

// Instance method to reserve stock
productSchema.methods.reserveStock = function(quantity) {
  if (this.availableQuantity >= quantity) {
    this.reservedQuantity += quantity;
    return true;
  }
  return false;
};

// Instance method to release reserved stock
productSchema.methods.releaseReservedStock = function(quantity) {
  if (this.reservedQuantity >= quantity) {
    this.reservedQuantity -= quantity;
    return true;
  }
  return false;
};

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema); 