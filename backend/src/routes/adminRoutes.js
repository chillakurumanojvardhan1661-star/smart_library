import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
// Dashboard stats - Admin and faculty can view
router.get('/stats', requireRole('admin', 'faculty'), adminController.getDashboardStats);
router.get('/activities', requireRole('admin', 'faculty'), adminController.getRecentActivities);

// User list - Admin and faculty can view
router.get('/users', requireRole('admin', 'faculty'), adminController.getAllUsers);

// Restricted admin-only operations
router.use(requireRole('admin'));

// User management
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
