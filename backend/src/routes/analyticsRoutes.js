import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Analytics require authentication
router.use(authenticateToken);

// Admin and faculty can view analytics
router.get('/issues-trend', requireRole('admin', 'faculty'), analyticsController.getIssuesTrend);
router.get('/category-distribution', requireRole('admin', 'faculty'), analyticsController.getCategoryDistribution);
router.get('/top-borrowers', requireRole('admin'), analyticsController.getTopBorrowers);
router.get('/fines', requireRole('admin'), analyticsController.getFineAnalytics);

export default router;
