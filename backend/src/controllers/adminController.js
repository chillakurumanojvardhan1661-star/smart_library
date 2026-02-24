import pool from '../config/db-adapter.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, department, employee_id, student_id, phone, status, 
              total_fine_balance, created_at, approved_by, approved_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;
    
    if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await pool.query(
      `UPDATE users 
       SET status = ?, 
           approved_by = ?, 
           approved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, adminId, id]
    );
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'faculty', 'student', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userResult.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};

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
