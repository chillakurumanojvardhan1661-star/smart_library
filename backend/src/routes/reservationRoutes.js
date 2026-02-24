import express from 'express';
import * as reservationController from '../controllers/reservationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// User routes (Student, Faculty, Staff)
router.post('/', authenticateToken, reservationController.createReservation);
router.get('/my-reservations', authenticateToken, reservationController.getUserReservations);
router.patch('/:id/cancel', authenticateToken, reservationController.cancelReservation);

// Admin routes
router.get('/', authenticateToken, requireRole('admin'), reservationController.getAllReservations);
router.patch('/:id/approve', authenticateToken, requireRole('admin'), reservationController.approveReservation);
router.patch('/:id/reject', authenticateToken, requireRole('admin'), reservationController.rejectReservation);

export default router;
