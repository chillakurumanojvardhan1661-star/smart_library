import express from 'express';
import * as issueController from '../controllers/issueController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All issue routes require authentication
router.use(authenticateToken);

// Admin can see all issues, others can only see their own
router.get('/', issueController.getAllIssues);
router.get('/overdue', requireRole('admin'), issueController.getOverdueBooks);

// Admin can issue books, users can request
router.post('/', requireRole('admin'), issueController.issueBook);

// Admin can process returns
router.put('/:id/return', requireRole('admin'), issueController.returnBook);

export default router;
