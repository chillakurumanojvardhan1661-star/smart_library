import pool from '../config/db-adapter.js';

export const exportBooks = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const result = await pool.query('SELECT * FROM books ORDER BY title');
    
    if (format === 'csv') {
      const csv = convertToCSV(result.rows, ['id', 'isbn', 'title', 'author', 'category', 'publisher', 'publication_year', 'total_copies', 'available_copies']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=books.csv');
      res.send(csv);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportMembers = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const result = await pool.query('SELECT * FROM members ORDER BY name');
    
    if (format === 'csv') {
      const csv = convertToCSV(result.rows, ['id', 'member_id', 'name', 'email', 'phone', 'address', 'status']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
      res.send(csv);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportIssues = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const result = await pool.query(`
      SELECT i.*, b.title, b.author, m.name as member_name, m.member_id
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN members m ON i.member_id = m.id
      ORDER BY i.issue_date DESC
    `);
    
    if (format === 'csv') {
      const csv = convertToCSV(result.rows, ['id', 'title', 'author', 'member_name', 'member_id', 'issue_date', 'due_date', 'return_date', 'fine_amount', 'status']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=issues.csv');
      res.send(csv);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function convertToCSV(data, columns) {
  if (!data || data.length === 0) return '';
  
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      return value !== null && value !== undefined ? `"${value}"` : '';
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
}
