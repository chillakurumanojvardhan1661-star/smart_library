// Role-based configuration for borrowing rules

export const ROLE_CONFIG = {
  admin: {
    maxBooks: 999,
    dueDays: 365,
    fineRate: 0,
    canReserve: true,
    canRequestBooks: true,
    priority: 1,
    description: 'Full system access',
  },
  faculty: {
    maxBooks: 10,
    dueDays: 30,
    fineRate: 3,
    canReserve: true,
    canRequestBooks: true,
    priority: 2,
    description: 'Extended borrowing privileges',
  },
  student: {
    maxBooks: 5,
    dueDays: 14,
    fineRate: 5,
    canReserve: true,
    canRequestBooks: false,
    priority: 4,
    description: 'Standard user access',
  },
  staff: {
    maxBooks: 5,
    dueDays: 21,
    fineRate: 4,
    canReserve: true,
    canRequestBooks: true,
    priority: 3,
    description: 'Medium access level',
  },
};

export const getRoleConfig = (role) => {
  return ROLE_CONFIG[role] || ROLE_CONFIG.student;
};

export const canPerformAction = (userRole, resource, action) => {
  const permissions = {
    admin: ['*'], // Admin can do everything
    faculty: ['read', 'borrow', 'reserve', 'request'],
    student: ['read', 'borrow', 'reserve'],
    staff: ['read', 'borrow', 'reserve', 'request'],
  };

  const rolePermissions = permissions[userRole] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(action);
};
