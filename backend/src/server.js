import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import fineRoutes from './routes/fineRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';

// dotenv already initialized at top

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite if configured
if (process.env.USE_SQLITE === 'true') {
  const { initDatabase } = await import('./config/database-sqlite.js');
  await initDatabase();
}

// Middleware
app.use(cors());
app.use(express.json());

import uploadRoutes from './routes/uploadRoutes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VIT-AP University Central Library API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.USE_SQLITE === 'true' ? 'SQLite' : 'PostgreSQL'}`);
  console.log(`✨ Features: Auth, Recommendations, Analytics, Export, Fine Management`);
});
