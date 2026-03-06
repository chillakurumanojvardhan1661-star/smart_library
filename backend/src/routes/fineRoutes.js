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

// Get user's own fines list
router.get('/my-fines', fineController.getMyFines);

// Get fine by ID (admin only)
router.get('/:id', requireRole('admin'), fineController.getFineById);

// Record payment (admin and users can pay their own fines)
router.post('/:id/payment', fineController.recordPayment);

// Waive fine (admin only)
router.post('/:id/waive', requireRole('admin'), fineController.waiveFine);

// Create manual fine (admin only)
router.post('/manual', requireRole('admin'), fineController.createManualFine);

// Admin: Update fine amount
router.patch('/:id/amount', requireRole('admin'), fineController.updateFineAmount);

// Admin: Update fine status
router.patch('/:id/status', requireRole('admin'), fineController.updateFineStatus);

// Admin: Delete fine
router.delete('/:id', requireRole('admin'), fineController.deleteFine);

// Admin: Get fine details with payments
router.get('/:id/details', requireRole('admin'), fineController.getFineDetails);

// Admin: Bulk waive fines
router.post('/bulk/waive', requireRole('admin'), fineController.bulkWaiveFines);

export default router;
