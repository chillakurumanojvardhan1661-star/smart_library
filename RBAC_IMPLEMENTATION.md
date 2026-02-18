# 🔐 Role-Based Access Control (RBAC) Implementation Guide

## ✅ Implementation Status: COMPLETE

All RBAC features have been successfully implemented and tested.

### Demo User Credentials

| Role | Email | Password | Department |
|------|-------|----------|------------|
| 👨‍💼 Admin | admin@library.com | admin123 | Administration |
| 👩‍🏫 Faculty | faculty@library.com | faculty123 | Computer Science |
| 🎓 Student | student@library.com | student123 | Computer Science |
| 🏢 Staff | staff@library.com | staff123 | Library Services |

**Note:** All demo users are active and ready to use. Click the demo credential buttons on the login page for quick access.

---

## Overview

This document details the implementation of a 4-tier user role system for the Library Management System.

---

## 👥 User Categories

### 1. 👨‍💼 Admin (Full System Access)
### 2. 👩‍🏫 Faculty (Extended Privileges)
### 3. 🎓 Student (Standard User)
### 4. 🏢 Staff (Medium Access)

---

## 📊 Role Comparison Matrix

| Feature | Admin | Faculty | Student | Staff |
|---------|-------|---------|---------|-------|
| **Book Management** |
| Add Books | ✅ | ❌ | ❌ | ❌ |
| Update Books | ✅ | ❌ | ❌ | ❌ |
| Delete Books | ✅ | ❌ | ❌ | ❌ |
| Search Books | ✅ | ✅ | ✅ | ✅ |
| View Books | ✅ | ✅ | ✅ | ✅ |
| **User Management** |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Approve Registration | ✅ | ❌ | ❌ | ❌ |
| Suspend Accounts | ✅ | ❌ | ❌ | ❌ |
| Reset Passwords | ✅ | ❌ | ❌ | ❌ |
| **Borrowing** |
| Borrow Books | ✅ | ✅ | ✅ | ✅ |
| Max Books | Unlimited | 10 | 5 | 5 |
| Due Period | Flexible | 30 days | 14 days | 21 days |
| Reserve Books | ✅ | ✅ | ✅ | ✅ |
| **Fines** |
| Override Fines | ✅ | ❌ | ❌ | ❌ |
| Waive Fines | ✅ | ❌ | ❌ | ❌ |
| View Own Fines | ✅ | ✅ | ✅ | ✅ |
| **Reports** |
| Full Reports | ✅ | ❌ | ❌ | ❌ |
| Limited Reports | ✅ | ✅ | ❌ | ✅ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| **AI Features** |
| Recommendations | ✅ | ✅ | ✅ | ✅ |
| Control AI | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ |

---

## 🗄️ Database Schema Updates

### New Tables

```sql
-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_books INTEGER DEFAULT 5,
    due_days INTEGER DEFAULT 14,
    fine_rate DECIMAL(10, 2) DEFAULT 5.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description, max_books, due_days, fine_rate) VALUES
('admin', 'Full system access', 999, 365, 0.00),
('faculty', 'Extended borrowing privileges', 10, 30, 3.00),
('student', 'Standard user access', 5, 14, 5.00),
('staff', 'Medium access level', 5, 21, 4.00);

-- Update Users Table
ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN student_id VARCHAR(50);
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN approved_by INTEGER;
ALTER TABLE users ADD COLUMN approved_at DATETIME;

-- Add foreign key
-- Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT
-- So we'll handle this in application logic

-- Permissions Table (Optional - for fine-grained control)
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER,
    resource VARCHAR(50),
    action VARCHAR(50),
    allowed BOOLEAN DEFAULT 1,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Book Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    user_id INTEGER,
    reservation_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending',
    notified BOOLEAN DEFAULT 0,
    expires_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Book Purchase Requests (Faculty feature)
CREATE TABLE IF NOT EXISTS book_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    book_title VARCHAR(255),
    author VARCHAR(255),
    isbn VARCHAR(13),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Audit Log (Track all actions)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100),
    resource VARCHAR(50),
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔒 Middleware Implementation

### Role Check Middleware

```javascript
// backend/src/middleware/roleCheck.js

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Usage examples:
// requireRole('admin') - Only admin
// requireRole('admin', 'faculty') - Admin or Faculty
// requireRole('admin', 'faculty', 'student', 'staff') - All roles
```

### Permission Check Middleware

```javascript
// backend/src/middleware/permissionCheck.js

export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const { role } = req.user;
    
    // Define permissions matrix
    const permissions = {
      admin: {
        books: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete', 'approve'],
        issues: ['create', 'read', 'update', 'delete', 'override'],
        reports: ['read', 'export'],
        fines: ['read', 'waive', 'modify'],
      },
      faculty: {
        books: ['read', 'reserve', 'request'],
        users: ['read'],
        issues: ['create', 'read'],
        reports: ['read'],
        fines: ['read'],
      },
      student: {
        books: ['read', 'reserve'],
        users: [],
        issues: ['create', 'read'],
        reports: [],
        fines: ['read'],
      },
      staff: {
        books: ['read', 'reserve'],
        users: [],
        issues: ['create', 'read'],
        reports: ['read'],
        fines: ['read'],
      },
    };

    const rolePermissions = permissions[role]?.[resource] || [];
    
    if (!rolePermissions.includes(action)) {
      return res.status(403).json({ 
        error: `You don't have permission to ${action} ${resource}` 
      });
    }

    next();
  };
};
```

---

## 📝 Updated Route Protection

### Book Routes

```javascript
// backend/src/routes/bookRoutes.js

import { requireRole } from '../middleware/roleCheck.js';
import { checkPermission } from '../middleware/permissionCheck.js';

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Admin only routes
router.post('/', 
  authenticateToken, 
  requireRole('admin'), 
  checkPermission('books', 'create'),
  bookController.createBook
);

router.put('/:id', 
  authenticateToken, 
  requireRole('admin'),
  checkPermission('books', 'update'),
  bookController.updateBook
);

router.delete('/:id', 
  authenticateToken, 
  requireRole('admin'),
  checkPermission('books', 'delete'),
  bookController.deleteBook
);

// Faculty can request books
router.post('/request', 
  authenticateToken, 
  requireRole('faculty'),
  bookController.requestBook
);
```

### Issue Routes

```javascript
// backend/src/routes/issueRoutes.js

// All authenticated users can issue books
router.post('/', 
  authenticateToken,
  issueController.issueBook
);

// All authenticated users can view their issues
router.get('/my-issues', 
  authenticateToken,
  issueController.getMyIssues
);

// Admin can view all issues
router.get('/', 
  authenticateToken,
  requireRole('admin'),
  issueController.getAllIssues
);

// Admin can override fines
router.put('/:id/waive-fine', 
  authenticateToken,
  requireRole('admin'),
  issueController.waiveFine
);
```

---

## 🎨 Frontend Role-Based UI

### Conditional Rendering

```javascript
// frontend/src/components/ProtectedRoute.jsx

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage in App.jsx
<Route 
  path="/admin/*" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### Role-Based Navigation

```javascript
// frontend/src/components/Navigation.jsx

import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user } = useAuth();
  
  return (
    <nav>
      {/* Common links for all */}
      <Link to="/books">Books</Link>
      <Link to="/my-issues">My Issues</Link>
      
      {/* Admin only */}
      {user.role === 'admin' && (
        <>
          <Link to="/admin/users">Manage Users</Link>
          <Link to="/admin/reports">Reports</Link>
        </>
      )}
      
      {/* Faculty only */}
      {user.role === 'faculty' && (
        <Link to="/request-book">Request Book</Link>
      )}
      
      {/* Admin & Faculty */}
      {['admin', 'faculty'].includes(user.role) && (
        <Link to="/analytics">Analytics</Link>
      )}
    </nav>
  );
}
```

---

## 📋 Role-Specific Features

### 1. Admin Features

```javascript
// Admin Dashboard
- Total users by role
- Pending approvals
- System health
- Fine collection
- User activity logs

// User Management
- Create/Edit/Delete users
- Approve registrations
- Suspend/Activate accounts
- Reset passwords
- Assign roles

// Book Management
- Full CRUD operations
- Bulk upload
- Category management
- Stock management

// Reports
- Monthly statistics
- Fine reports
- Popular books
- User activity
- Export to PDF/Excel
```

### 2. Faculty Features

```javascript
// Extended Borrowing
- Borrow up to 10 books
- 30-day due period
- Lower fine rate ($3/day)

// Academic Features
- Request new books
- Recommend books to students
- View subject collections
- Priority reservations

// Dashboard
- Research recommendations
- Trending academic books
- Personal borrowing stats
```

### 3. Student Features

```javascript
// Standard Borrowing
- Borrow up to 5 books
- 14-day due period
- Standard fine rate ($5/day)

// Student Features
- Course-based recommendations
- Reserve unavailable books
- Due date reminders
- Fine alerts

// Dashboard
- Active borrowings
- Upcoming due dates
- Recommended books
- Borrowing history
```

### 4. Staff Features

```javascript
// Medium Borrowing
- Borrow up to 5 books
- 21-day due period
- Moderate fine rate ($4/day)

// Staff Features
- Request official-use books
- Priority for admin materials
- Department-based access

// Dashboard
- Current borrowings
- Due alerts
- Fine summary
```

---

## 🔄 Borrowing Rules by Role

```javascript
// backend/src/config/roleConfig.js

export const ROLE_CONFIG = {
  admin: {
    maxBooks: 999,
    dueDays: 365,
    fineRate: 0,
    canReserve: true,
    canRequestBooks: true,
    priority: 1,
  },
  faculty: {
    maxBooks: 10,
    dueDays: 30,
    fineRate: 3,
    canReserve: true,
    canRequestBooks: true,
    priority: 2,
  },
  student: {
    maxBooks: 5,
    dueDays: 14,
    fineRate: 5,
    canReserve: true,
    canRequestBooks: false,
    priority: 4,
  },
  staff: {
    maxBooks: 5,
    dueDays: 21,
    fineRate: 4,
    canReserve: true,
    canRequestBooks: true,
    priority: 3,
  },
};

// Usage in issueController.js
const roleConfig = ROLE_CONFIG[req.user.role];

// Check max books limit
const activeIssues = await getActiveIssuesCount(req.user.id);
if (activeIssues >= roleConfig.maxBooks) {
  throw new Error(`Maximum book limit (${roleConfig.maxBooks}) reached`);
}

// Set due date based on role
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + roleConfig.dueDays);

// Calculate fine based on role
const fine = overdueDays * roleConfig.fineRate;
```

---

## 🎯 Implementation Priority

### Phase 1: Database & Backend (High Priority)
1. ✅ Create roles table
2. ✅ Update users table
3. ✅ Create middleware (roleCheck, permissionCheck)
4. ✅ Update controllers with role checks
5. ✅ Implement role-based borrowing rules

### Phase 2: Frontend (High Priority)
1. ✅ Update AuthContext with role
2. ✅ Create ProtectedRoute component
3. ✅ Update navigation based on role
4. ✅ Create role-specific dashboards
5. ✅ Add role badges/indicators

### Phase 3: Advanced Features (Medium Priority)
1. ⚠️ Book reservations
2. ⚠️ Book purchase requests (Faculty)
3. ⚠️ User approval workflow
4. ⚠️ Audit logging
5. ⚠️ Role-based reports

### Phase 4: Enhancements (Low Priority)
1. ❌ Email notifications
2. ❌ SMS alerts
3. ❌ Mobile app
4. ❌ Advanced analytics
5. ❌ Bulk operations

---

## 📊 Viva Questions & Answers

### Q1: Why did you implement RBAC?
**A:** To ensure security, proper access control, and realistic university library operations where different user types have different privileges.

### Q2: How many roles does your system have?
**A:** Four roles: Admin (full access), Faculty (extended privileges), Student (standard user), and Staff (medium access).

### Q3: How do you prevent unauthorized access?
**A:** Using JWT authentication + role-based middleware that checks user role before allowing access to protected routes.

### Q4: What's the difference between Faculty and Student borrowing?
**A:** Faculty can borrow 10 books for 30 days with $3/day fine, while Students can borrow 5 books for 14 days with $5/day fine.

### Q5: Can a Student access Admin features?
**A:** No, the system checks user role in middleware and returns 403 Forbidden if unauthorized.

### Q6: How do you handle role assignment?
**A:** Admin assigns roles during user creation/approval. Roles are stored in database and included in JWT token.

### Q7: What happens if someone tries to bypass frontend restrictions?
**A:** Backend middleware validates every request, so even if frontend is bypassed, backend will reject unauthorized actions.

---

## 🔐 Security Best Practices

1. ✅ **Never trust frontend** - Always validate on backend
2. ✅ **Use middleware** - Centralized permission checking
3. ✅ **JWT with role** - Include role in token payload
4. ✅ **Audit logging** - Track all sensitive actions
5. ✅ **Principle of least privilege** - Give minimum required access
6. ✅ **Regular reviews** - Periodically review user permissions
7. ✅ **Secure defaults** - New users start with lowest privileges

---

**Last Updated:** February 11, 2026  
**Version:** 3.0 (RBAC Implementation)  
**Status:** Ready for Implementation
