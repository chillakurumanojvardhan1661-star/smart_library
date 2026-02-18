import pool from '../config/db-adapter.js';
import { calculateFine } from './fineController.js';

export const issueBook = async (req, res) => {
  try {
    const { book_id, member_id, user_id } = req.body;
    
    // Get user's role to determine due days
    let dueDays = 14; // default
    if (user_id) {
      const userResult = await pool.query(
        'SELECT u.role, r.due_days, r.max_books FROM users u JOIN roles r ON u.role = r.role_name WHERE u.id = ?',
        [user_id]
      );
      
      if (userResult.rows.length > 0) {
        dueDays = userResult.rows[0].due_days;
        
        // Check if user has exceeded book limit
        const issueCountResult = await pool.query(
          'SELECT COUNT(*) as count FROM issues WHERE user_id = ? AND status = ?',
          [user_id, 'issued']
        );
        
        if (issueCountResult.rows[0].count >= userResult.rows[0].max_books) {
          return res.status(400).json({ error: 'Book borrowing limit exceeded' });
        }
        
        // Check if user has unpaid fines exceeding limit
        const fineResult = await pool.query(
          'SELECT u.total_fine_balance, r.fine_limit_for_suspension FROM users u JOIN roles r ON u.role = r.role_name WHERE u.id = ?',
          [user_id]
        );
        
        if (fineResult.rows[0].total_fine_balance >= fineResult.rows[0].fine_limit_for_suspension) {
          return res.status(403).json({ 
            error: 'Cannot issue book. Outstanding fine balance exceeds limit. Please clear fines first.' 
          });
        }
      }
    }
    
    // Check book availability
    const bookResult = await pool.query(
      'SELECT available_copies FROM books WHERE id = ?',
      [book_id]
    );
    
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (bookResult.rows[0].available_copies <= 0) {
      return res.status(400).json({ error: 'Book not available' });
    }
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Issue the book
    const result = await pool.query(
      `INSERT INTO issues (book_id, member_id, user_id, due_date, status)
       VALUES (?, ?, ?, ?, 'issued')`,
      [book_id, member_id, user_id, dueDateStr]
    );
    
    // Update book availability
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );
    
    res.status(201).json({ 
      message: 'Book issued successfully',
      issue_id: result.lastID,
      due_date: dueDateStr
    });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { fine_type = 'overdue', notes } = req.body;
    
    // Get issue details
    const issueResult = await pool.query(
      'SELECT * FROM issues WHERE id = ? AND status = ?',
      [id, 'issued']
    );
    
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue record not found or already returned' });
    }
    
    const issue = issueResult.rows[0];
    const returnDate = new Date();
    const dueDate = new Date(issue.due_date);
    
    // Calculate overdue days
    const diffTime = returnDate - dueDate;
    const overdueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let fineAmount = 0;
    let fineCalculation = null;
    
    // Calculate fine if overdue and user exists
    if (overdueDays > 0 && issue.user_id) {
      fineCalculation = await calculateFine(issue.user_id, overdueDays);
      fineAmount = fineCalculation.fineAmount;
    }
    
    // Update issue record
    await pool.query(
      `UPDATE issues 
       SET return_date = date('now'), 
           overdue_days = ?, 
           fine_amount = ?, 
           fine_status = ?,
           fine_type = ?,
           notes = ?,
           status = 'returned', 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [overdueDays, fineAmount, fineAmount > 0 ? 'unpaid' : 'none', fine_type, notes, id]
    );
    
    // Update book availability
    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [issue.book_id]
    );
    
    // Create fine record if applicable
    if (fineAmount > 0) {
      const fineResult = await pool.query(
        `INSERT INTO fines (issue_id, user_id, member_id, fine_amount, fine_type, overdue_days, fine_status)
         VALUES (?, ?, ?, ?, ?, ?, 'unpaid')`,
        [id, issue.user_id, issue.member_id, fineAmount, fine_type, overdueDays]
      );
      
      // Update user/member fine balance
      if (issue.user_id) {
        await pool.query(
          'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
          [fineAmount, issue.user_id]
        );
      }
      
      if (issue.member_id) {
        await pool.query(
          'UPDATE members SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
          [fineAmount, issue.member_id]
        );
      }
    }
    
    res.json({ 
      message: 'Book returned successfully',
      overdue_days: overdueDays,
      fine_amount: fineAmount,
      fine_calculation: fineCalculation
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllIssues = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT i.*, b.title, b.author, m.name as member_name, m.member_id
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN members m ON i.member_id = m.id
    `;
    
    if (status) {
      query += ` WHERE i.status = $1`;
    }
    
    query += ' ORDER BY i.issue_date DESC';
    
    const result = status 
      ? await pool.query(query, [status])
      : await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOverdueBooks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, b.title, b.author, m.name as member_name, m.member_id
       FROM issues i
       JOIN books b ON i.book_id = b.id
       JOIN members m ON i.member_id = m.id
       WHERE i.status = 'issued' AND i.due_date < CURRENT_DATE
       ORDER BY i.due_date`
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
