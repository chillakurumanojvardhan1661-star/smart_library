import express from 'express';
import * as memberController from '../controllers/memberController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All member routes require authentication
router.use(authenticateToken);

// Admin can manage members
router.get('/', requireRole('admin'), memberController.getAllMembers);
router.get('/:id', requireRole('admin'), memberController.getMemberById);
router.get('/:id/history', requireRole('admin'), memberController.getMemberHistory);
router.post('/', requireRole('admin'), memberController.createMember);
router.put('/:id', requireRole('admin'), memberController.updateMember);

export default router;
