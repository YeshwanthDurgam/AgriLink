const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['buyer', 'farmer', 'admin', 'produce_manager', 'logistics_coordinator', 'farmer_support'],
    default: 'buyer'
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  
  // Enhanced Farmer Specific Information
  farmName: {
    type: String,
    default: ''
  },
  farmSize: {
    type: String,
    default: ''
  },
  farmLocation: {
    type: String,
    default: ''
  },
  farmAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  cropSpecialties: [{
    type: String,
    enum: ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Seeds', 'Dairy', 'Other']
  }],
  certifications: [{
    type: String,
    enum: ['Organic', 'GAP', 'HACCP', 'ISO', 'FSSAI', 'Fair Trade', 'Rainforest Alliance', 'Other']
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['aadhar', 'pan', 'land_document', 'certification', 'other']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  farmRegistrationNumber: String,
  gstNumber: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  
  // Buyer Specific Information
  preferences: [{
    type: String,
    default: []
  }],
  favoriteCategories: [{
    type: String,
    default: []
  }],
  deliveryAddresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }],
  
  // Notification Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  
  // Privacy Settings
  privacy: {
    showProfile: {
      type: Boolean,
      default: true
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    showContact: {
      type: Boolean,
      default: false
    }
  },
  
  // Language & Region
  language: {
    type: String,
    default: 'en'
  },
  currency: {
    type: String,
    default: 'inr'
  },
  
  // Enhanced Stats (for analytics)
  stats: {
    // Buyer stats
    ordersPlaced: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    favoriteFarmers: {
      type: Number,
      default: 0
    },
    reviewsGiven: {
      type: Number,
      default: 0
    },
    // Farmer stats
    productsListed: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    // Performance metrics
    onTimeDelivery: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      default: 0
    },
    customerSatisfaction: {
      type: Number,
      default: 0
    }
  },
  
  // Security
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending_verification'],
    default: 'pending_verification'
  },
  
  // Two-Factor Authentication
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  
  // Password Reset
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  
  // Admin specific fields
  adminPermissions: [{
    type: String,
    enum: [
      'farmer_approval',
      'product_approval', 
      'pricing_management',
      'logistics_management',
      'user_management',
      'analytics_access',
      'communication_management',
      'payment_management',
      'settings_management'
    ]
  }],
  
  // Activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String,
    location: String
  }],
  
  // Customer flagging
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  flagHistory: [{
    reason: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    notes: String
  }],
  
  // Customer feedback logs
  feedbacks: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const requiredFields = ['name', 'email', 'phone', 'location'];
  const optionalFields = ['bio', 'avatar'];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (this[field] && this[field].toString().trim() !== '') {
      completed++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (this[field] && this[field].toString().trim() !== '') {
      completed++;
    }
  });
  
  // Add role-specific fields
  if (this.role === 'farmer') {
    const farmerFields = ['farmName', 'farmSize', 'farmLocation'];
    total += farmerFields.length;
    farmerFields.forEach(field => {
      if (this[field] && this[field].toString().trim() !== '') {
        completed++;
      }
    });
  } else if (this.role === 'buyer') {
    const buyerFields = ['preferences', 'favoriteCategories'];
    total += buyerFields.length;
    buyerFields.forEach(field => {
      if (this[field] && this[field].length > 0) {
        completed++;
      }
    });
  }
  
  return Math.round((completed / total) * 100);
});

// Virtual for status text
userSchema.virtual('statusText').get(function() {
  if (this.role === 'farmer') {
    return this.isVerified ? 'Verified Farmer' : 'Farmer';
  } else {
    return 'Premium Buyer';
  }
});

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema); 