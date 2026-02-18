import pool from '../config/db-adapter.js';

// Simple recommendation algorithm based on:
// 1. User's borrowing history
// 2. Popular books in same category
// 3. Books by same author
export const getRecommendations = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Get member's borrowing history
    const historyResult = await pool.query(
      `SELECT DISTINCT b.category, b.author 
       FROM issues i
       JOIN books b ON i.book_id = b.id
       WHERE i.member_id = ?
       LIMIT 10`,
      [memberId]
    );
    
    if (historyResult.rows.length === 0) {
      // New user - recommend popular books
      const popularResult = await pool.query(
        `SELECT b.*, COUNT(i.id) as borrow_count
         FROM books b
         LEFT JOIN issues i ON b.id = i.book_id
         GROUP BY b.id
         ORDER BY borrow_count DESC
         LIMIT 5`
      );
      return res.json(popularResult.rows);
    }
    
    const categories = [...new Set(historyResult.rows.map(r => r.category))];
    const authors = [...new Set(historyResult.rows.map(r => r.author))];
    
    // Recommend books from same categories/authors not yet borrowed
    const recommendations = await pool.query(
      `SELECT DISTINCT b.*, 
        CASE 
          WHEN b.author IN (${authors.map(() => '?').join(',')}) THEN 2
          WHEN b.category IN (${categories.map(() => '?').join(',')}) THEN 1
          ELSE 0
        END as relevance_score
       FROM books b
       WHERE b.id NOT IN (
         SELECT book_id FROM issues WHERE member_id = ?
       )
       AND b.available_copies > 0
       ORDER BY relevance_score DESC, b.title
       LIMIT 10`,
      [...authors, ...categories, memberId]
    );
    
    res.json(recommendations.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrendingBooks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, COUNT(i.id) as issue_count
       FROM books b
       LEFT JOIN issues i ON b.id = i.book_id 
         AND i.issue_date >= date('now', '-30 days')
       GROUP BY b.id
       ORDER BY issue_count DESC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
