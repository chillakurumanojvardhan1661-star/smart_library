import pool from '../config/db-adapter.js';

export const getIssuesTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(
      `SELECT date(issue_date) as date, COUNT(*) as count
       FROM issues
       WHERE issue_date >= date('now', '-' || ? || ' days')
       GROUP BY date(issue_date)
       ORDER BY date`,
      [days]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryDistribution = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM books
       GROUP BY category
       ORDER BY count DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTopBorrowers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.name, m.member_id, COUNT(i.id) as borrow_count
       FROM members m
       LEFT JOIN issues i ON m.id = i.member_id
       GROUP BY m.id
       ORDER BY borrow_count DESC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFineAnalytics = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_fines,
        SUM(fine_amount) as total_amount,
        AVG(fine_amount) as avg_fine,
        MAX(fine_amount) as max_fine
       FROM issues
       WHERE fine_amount > 0`
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
