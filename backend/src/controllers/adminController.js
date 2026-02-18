import pool from '../config/db-adapter.js';

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT SUM(total_copies) FROM books) as total_copies,
        (SELECT SUM(available_copies) FROM books) as available_copies,
        (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
        (SELECT COUNT(*) FROM issues WHERE status = 'issued') as books_issued,
        (SELECT COUNT(*) FROM issues WHERE status = 'issued' AND due_date < CURRENT_DATE) as overdue_books,
        (SELECT COALESCE(SUM(fine_amount), 0) FROM issues WHERE status = 'returned') as total_fines_collected
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, b.title, m.name as member_name, m.member_id
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN members m ON i.member_id = m.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
