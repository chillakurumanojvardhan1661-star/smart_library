// Role-based access control middleware

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Permission matrix for fine-grained control
const PERMISSIONS = {
  admin: {
    books: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete', 'approve'],
    members: ['create', 'read', 'update', 'delete'],
    issues: ['create', 'read', 'update', 'delete', 'override'],
    reports: ['read', 'export'],
    fines: ['read', 'waive', 'modify'],
    analytics: ['read'],
  },
  faculty: {
    books: ['read', 'reserve', 'request'],
    users: ['read'],
    members: [],
    issues: ['create', 'read'],
    reports: ['read'],
    fines: ['read'],
    analytics: ['read'],
  },
  student: {
    books: ['read', 'reserve'],
    users: [],
    members: [],
    issues: ['create', 'read'],
    reports: [],
    fines: ['read'],
    analytics: [],
  },
  staff: {
    books: ['read', 'reserve'],
    users: [],
    members: [],
    issues: ['create', 'read'],
    reports: ['read'],
    fines: ['read'],
    analytics: [],
  },
};

export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const rolePermissions = PERMISSIONS[req.user.role]?.[resource] || [];
    
    if (!rolePermissions.includes(action)) {
      return res.status(403).json({ 
        error: `You don't have permission to ${action} ${resource}`,
        role: req.user.role,
        resource,
        action
      });
    }

    next();
  };
};

// Check if user can perform action on own resource
export const checkOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (parseInt(resourceId) !== parseInt(userId)) {
      return res.status(403).json({ 
        error: 'You can only access your own resources' 
      });
    }

    next();
  };
};
