import express from 'express';
import * as fineController from '../controllers/fineController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All fine routes require authentication
router.use(authenticateToken);

// Get all fines (admin only)
router.get('/', requireRole('admin'), fineController.getAllFines);

// Get fine statistics (admin only)
router.get('/stats', requireRole('admin'), fineController.getFineStats);

// Get user's own fine balance
router.get('/my-balance', fineController.getUserFineBalance);

// Get fine by ID (admin only)
router.get('/:id', requireRole('admin'), fineController.getFineById);

// Record payment (admin only)
router.post('/:id/payment', requireRole('admin'), fineController.recordPayment);

// Waive fine (admin only)
router.post('/:id/waive', requireRole('admin'), fineController.waiveFine);

// Create manual fine (admin only)
router.post('/manual', requireRole('admin'), fineController.createManualFine);

export default router;
