import express from 'express';
import * as recommendationController from '../controllers/recommendationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Recommendations available to all authenticated users
router.use(authenticateToken);

router.get('/member/:memberId', recommendationController.getRecommendations);
router.get('/trending', recommendationController.getTrendingBooks);

export default router;
