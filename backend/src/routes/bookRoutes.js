import express from 'express';
import * as bookController from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole, checkPermission } from '../middleware/roleCheck.js';

const router = express.Router();

// Public routes - anyone can view books
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Protected routes - only admin can create/update/delete
router.post('/', authenticateToken, requireRole('admin'), bookController.createBook);
router.put('/:id', authenticateToken, requireRole('admin'), bookController.updateBook);
router.delete('/:id', authenticateToken, requireRole('admin'), bookController.deleteBook);

export default router;
