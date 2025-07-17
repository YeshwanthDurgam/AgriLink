const User = require('../models/User');

// Role hierarchy and permissions mapping
const ROLE_HIERARCHY = {
  'admin': ['admin', 'produce_manager', 'logistics_coordinator', 'farmer_support', 'communication_manager', 'analytics_manager', 'pricing_manager'],
  'produce_manager': ['produce_manager'],
  'logistics_coordinator': ['logistics_coordinator'],
  'farmer_support': ['farmer_support'],
  'communication_manager': ['communication_manager'],
  'analytics_manager': ['analytics_manager'],
  'pricing_manager': ['pricing_manager']
};

// Permission-based access control
const PERMISSIONS = {
  // User Management
  'user:read': ['admin', 'farmer_support'],
  'user:write': ['admin'],
  'user:delete': ['admin'],
  'farmer:approve': ['admin', 'farmer_support'],
  'farmer:suspend': ['admin'],
  // Product Management
  'product:read': ['admin', 'produce_manager'],
  'product:write': ['admin', 'produce_manager'],
  'product:delete': ['admin'],
  'product:approve': ['admin', 'produce_manager'],
  'product:suspend': ['admin', 'produce_manager'],
  // Order Management
  'order:read': ['admin', 'logistics_coordinator'],
  'order:write': ['admin', 'logistics_coordinator'],
  'order:delete': ['admin'],
  // Pricing Management
  'pricing:read': ['admin', 'pricing_manager'],
  'pricing:write': ['admin', 'pricing_manager'],
  // Analytics
  'analytics:read': ['admin', 'analytics_manager'],
  'analytics:export': ['admin', 'analytics_manager'],
  // Communication
  'announcement:read': ['admin', 'communication_manager'],
  'announcement:write': ['admin', 'communication_manager'],
  'announcement:delete': ['admin'],
  'announcement:approve': ['admin'],
  // System
  'system:monitor': ['admin'],
  'system:configure': ['admin'],
  'system:backup': ['admin']
};

// Basic role check middleware
module.exports = function roleCheck(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    // Debug log for role check
    console.log('roleCheck middleware:', {
      userRole: req.user.role,
      allowedRoles
    });
    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some(role => {
      // Check direct role match
      if (req.user.role === role) return true;
      // Check role hierarchy
      const userPermissions = ROLE_HIERARCHY[req.user.role] || [];
      return userPermissions.includes(role);
    });
    if (!hasRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    next();
  };
};

// Permission-based middleware
module.exports.permission = function(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      return res.status(500).json({ 
        success: false,
        message: 'Permission not defined' 
      });
    }
    // Check if user has permission through role hierarchy
    const hasPermission = allowedRoles.some(role => {
      if (req.user.role === role) return true;
      const userPermissions = ROLE_HIERARCHY[req.user.role] || [];
      return userPermissions.includes(role);
    });
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: insufficient permissions',
        required: permission,
        current: req.user.role
      });
    }
    next();
  };
};

// Admin-only middleware
module.exports.adminOnly = function() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: admin privileges required',
        current: req.user.role
      });
    }
    next();
  };
}; 