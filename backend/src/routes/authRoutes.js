import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/users', authenticateToken, requireRole('admin'), authController.getAllUsers);
router.patch('/users/:id/approve', authenticateToken, requireRole('admin'), authController.approveUser);
router.patch('/users/:id/reject', authenticateToken, requireRole('admin'), authController.rejectUser);
router.patch('/users/:id/suspend', authenticateToken, requireRole('admin'), authController.suspendUser);

export default router;
