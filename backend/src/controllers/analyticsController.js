import pool from '../config/db-adapter.js';

export const getIssuesTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - parseInt(days));
    const dateStr = pastDate.toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT CAST(issue_date AS DATE) as date, CAST(COUNT(*) AS INTEGER) as count
       FROM issues
       WHERE issue_date >= $1
       GROUP BY CAST(issue_date AS DATE)
       ORDER BY date`,
      [dateStr]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryDistribution = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, CAST(COUNT(*) AS INTEGER) as count
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
      `SELECT u.role as name, CAST(COUNT(i.id) AS INTEGER) as issue_count
       FROM users u
       JOIN issues i ON u.id = i.user_id
       WHERE u.role != 'admin'
       GROUP BY u.role
       ORDER BY issue_count DESC`
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
        CAST(COUNT(*) AS INTEGER) as total_fines,
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
