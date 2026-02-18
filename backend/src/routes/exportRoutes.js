import express from 'express';
import * as exportController from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Export requires authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/books', exportController.exportBooks);
router.get('/members', exportController.exportMembers);
router.get('/issues', exportController.exportIssues);

export default router;
