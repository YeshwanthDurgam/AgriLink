const User = require('../models/User');

// Role hierarchy and permissions mapping
const ROLE_HIERARCHY = {
  'super_admin': ['super_admin', 'admin', 'produce_manager', 'logistics_coordinator', 'farmer_support', 'communication_manager', 'analytics_manager', 'pricing_manager'],
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
  'user:read': ['super_admin', 'admin', 'farmer_support'],
  'user:write': ['super_admin', 'admin'],
  'user:delete': ['super_admin'],
  'farmer:approve': ['super_admin', 'admin', 'farmer_support'],
  'farmer:suspend': ['super_admin', 'admin'],
  
  // Product Management
  'product:read': ['super_admin', 'admin', 'produce_manager'],
  'product:write': ['super_admin', 'admin', 'produce_manager'],
  'product:delete': ['super_admin', 'admin'],
  'product:approve': ['super_admin', 'admin', 'produce_manager'],
  'product:suspend': ['super_admin', 'admin', 'produce_manager'],
  
  // Order Management
  'order:read': ['super_admin', 'admin', 'logistics_coordinator'],
  'order:write': ['super_admin', 'admin', 'logistics_coordinator'],
  'order:delete': ['super_admin', 'admin'],
  
  // Pricing Management
  'pricing:read': ['super_admin', 'admin', 'pricing_manager'],
  'pricing:write': ['super_admin', 'admin', 'pricing_manager'],
  
  // Analytics
  'analytics:read': ['super_admin', 'admin', 'analytics_manager'],
  'analytics:export': ['super_admin', 'admin', 'analytics_manager'],
  
  // Communication
  'announcement:read': ['super_admin', 'admin', 'communication_manager'],
  'announcement:write': ['super_admin', 'admin', 'communication_manager'],
  'announcement:delete': ['super_admin', 'admin'],
  'announcement:approve': ['super_admin', 'admin'],
  
  // System
  'system:monitor': ['super_admin', 'admin'],
  'system:configure': ['super_admin'],
  'system:backup': ['super_admin']
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

    if (!['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: admin privileges required',
        current: req.user.role
      });
    }

    next();
  };
};

// Super admin only middleware
module.exports.superAdminOnly = function() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: super admin privileges required',
        current: req.user.role
      });
    }

    next();
  };
}; 