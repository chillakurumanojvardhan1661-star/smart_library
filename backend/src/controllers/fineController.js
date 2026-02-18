import pool from '../config/db-adapter.js';

// Calculate fine based on role and overdue days
export const calculateFine = async (userId, overdueDays) => {
  try {
    // Get user's role
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userRole = userResult.rows[0].role;

    // Get role's fine settings
    const roleResult = await pool.query(
      'SELECT fine_rate, grace_days, max_fine_cap FROM roles WHERE role_name = ?',
      [userRole]
    );

    if (roleResult.rows.length === 0) {
      throw new Error('Role configuration not found');
    }

    const { fine_rate, grace_days, max_fine_cap } = roleResult.rows[0];

    // Apply grace period
    const chargeableDays = Math.max(0, overdueDays - grace_days);
    
    // Calculate fine
    let fineAmount = chargeableDays * fine_rate;
    
    // Apply fine cap
    if (max_fine_cap > 0 && fineAmount > max_fine_cap) {
      fineAmount = max_fine_cap;
    }

    return {
      fineAmount: parseFloat(fineAmount.toFixed(2)),
      chargeableDays,
      fineRate: fine_rate,
      graceDays: grace_days,
      cappedAt: fineAmount >= max_fine_cap ? max_fine_cap : null
    };
  } catch (error) {
    throw error;
  }
};

// Get all fines with filters
export const getAllFines = async (req, res) => {
  try {
    const { status, user_id, member_id, type } = req.query;
    
    let query = `
      SELECT 
        f.*,
        u.username,
        u.email as user_email,
        u.role,
        m.name as member_name,
        m.email as member_email,
        b.title as book_title,
        i.issue_date,
        i.due_date,
        i.return_date
      FROM fines f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN members m ON f.member_id = m.id
      LEFT JOIN issues i ON f.issue_id = i.id
      LEFT JOIN books b ON i.book_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND f.fine_status = ?';
      params.push(status);
    }
    
    if (user_id) {
      query += ' AND f.user_id = ?';
      params.push(user_id);
    }
    
    if (member_id) {
      query += ' AND f.member_id = ?';
      params.push(member_id);
    }
    
    if (type) {
      query += ' AND f.fine_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY f.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get fine by ID
export const getFineById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        f.*,
        u.username,
        u.email as user_email,
        u.role,
        m.name as member_name,
        m.email as member_email,
        b.title as book_title,
        i.issue_date,
        i.due_date,
        i.return_date
      FROM fines f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN members m ON f.member_id = m.id
      LEFT JOIN issues i ON f.issue_id = i.id
      LEFT JOIN books b ON i.book_id = b.id
      WHERE f.id = ?`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record fine payment
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, transaction_id, notes } = req.body;
    const adminId = req.user.id;
    
    // Get fine details
    const fineResult = await pool.query(
      'SELECT * FROM fines WHERE id = ?',
      [id]
    );
    
    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    
    const fine = fineResult.rows[0];
    
    if (fine.fine_status === 'paid') {
      return res.status(400).json({ error: 'Fine already paid' });
    }
    
    // Record payment
    await pool.query(
      `INSERT INTO fine_payments (fine_id, user_id, member_id, amount, payment_method, transaction_id, received_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, fine.user_id, fine.member_id, amount, payment_method, transaction_id, adminId, notes]
    );
    
    // Update fine status
    const newStatus = amount >= fine.fine_amount ? 'paid' : 'partially_paid';
    await pool.query(
      `UPDATE fines SET fine_status = ?, payment_method = ?, payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, payment_method, id]
    );
    
    // Update user/member fine balance
    if (fine.user_id) {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance - ? WHERE id = ?',
        [amount, fine.user_id]
      );
    }
    
    if (fine.member_id) {
      await pool.query(
        'UPDATE members SET total_fine_balance = total_fine_balance - ? WHERE id = ?',
        [amount, fine.member_id]
      );
    }
    
    res.json({ message: 'Payment recorded successfully', status: newStatus });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Waive fine (admin only)
export const waiveFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    // Get fine details
    const fineResult = await pool.query(
      'SELECT * FROM fines WHERE id = ?',
      [id]
    );
    
    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    
    const fine = fineResult.rows[0];
    
    // Update fine status to waived
    await pool.query(
      `UPDATE fines 
       SET fine_status = 'waived', 
           waived_by = ?, 
           waived_reason = ?, 
           waived_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [adminId, reason, id]
    );
    
    // Update user/member fine balance
    if (fine.user_id) {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance - ? WHERE id = ?',
        [fine.fine_amount, fine.user_id]
      );
    }
    
    if (fine.member_id) {
      await pool.query(
        'UPDATE members SET total_fine_balance = total_fine_balance - ? WHERE id = ?',
        [fine.fine_amount, fine.member_id]
      );
    }
    
    res.json({ message: 'Fine waived successfully' });
  } catch (error) {
    console.error('Waive fine error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get fine statistics
export const getFineStats = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND f.created_at >= date('now', '-30 days')";
    } else if (period === 'year') {
      dateFilter = "AND f.created_at >= date('now', '-365 days')";
    }
    
    // Total fines collected
    const collectedResult = await pool.query(
      `SELECT COALESCE(SUM(fine_amount), 0) as total_collected
       FROM fines
       WHERE fine_status = 'paid' ${dateFilter}`
    );
    
    // Outstanding fines
    const outstandingResult = await pool.query(
      `SELECT COALESCE(SUM(fine_amount), 0) as total_outstanding
       FROM fines
       WHERE fine_status = 'unpaid' ${dateFilter}`
    );
    
    // Waived fines
    const waivedResult = await pool.query(
      `SELECT COALESCE(SUM(fine_amount), 0) as total_waived
       FROM fines
       WHERE fine_status = 'waived' ${dateFilter}`
    );
    
    // Fine by type
    const byTypeResult = await pool.query(
      `SELECT fine_type, COUNT(*) as count, SUM(fine_amount) as total
       FROM fines
       WHERE 1=1 ${dateFilter}
       GROUP BY fine_type`
    );
    
    // Top defaulters
    const defaultersResult = await pool.query(
      `SELECT u.username, u.email, u.role, COUNT(f.id) as fine_count, SUM(f.fine_amount) as total_fines
       FROM fines f
       JOIN users u ON f.user_id = u.id
       WHERE f.fine_status = 'unpaid'
       GROUP BY u.id
       ORDER BY total_fines DESC
       LIMIT 10`
    );
    
    res.json({
      total_collected: collectedResult.rows[0].total_collected,
      total_outstanding: outstandingResult.rows[0].total_outstanding,
      total_waived: waivedResult.rows[0].total_waived,
      by_type: byTypeResult.rows,
      top_defaulters: defaultersResult.rows
    });
  } catch (error) {
    console.error('Fine stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's fine balance
export const getUserFineBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        total_fine_balance,
        (SELECT COUNT(*) FROM fines WHERE user_id = ? AND fine_status = 'unpaid') as unpaid_count,
        (SELECT COUNT(*) FROM issues WHERE user_id = ? AND status = 'issued' AND date(due_date) < date('now')) as overdue_books
       FROM users WHERE id = ?`,
      [userId, userId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create manual fine (for lost/damaged books)
export const createManualFine = async (req, res) => {
  try {
    const { user_id, member_id, fine_amount, fine_type, notes } = req.body;
    
    if (!user_id && !member_id) {
      return res.status(400).json({ error: 'Either user_id or member_id is required' });
    }
    
    // Create fine
    const result = await pool.query(
      `INSERT INTO fines (user_id, member_id, fine_amount, fine_type, fine_status)
       VALUES (?, ?, ?, ?, 'unpaid')`,
      [user_id, member_id, fine_amount, fine_type]
    );
    
    // Update balance
    if (user_id) {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
        [fine_amount, user_id]
      );
    }
    
    if (member_id) {
      await pool.query(
        'UPDATE members SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
        [fine_amount, member_id]
      );
    }
    
    res.status(201).json({ 
      message: 'Manual fine created successfully',
      fine_id: result.lastID
    });
  } catch (error) {
    console.error('Create manual fine error:', error);
    res.status(500).json({ error: error.message });
  }
};
