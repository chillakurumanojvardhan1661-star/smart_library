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
    const { payment_amount, amount, payment_method, transaction_id, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Accept either payment_amount or amount
    const paymentAmount = payment_amount || amount;

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    // Get fine details
    const fineResult = await pool.query(
      'SELECT * FROM fines WHERE id = ?',
      [id]
    );

    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const fine = fineResult.rows[0];

    // Non-admin users can only pay their own fines
    if (userRole !== 'admin' && fine.user_id !== userId) {
      return res.status(403).json({ error: 'You can only pay your own fines' });
    }

    if (fine.fine_status === 'paid') {
      return res.status(400).json({ error: 'Fine already paid' });
    }

    // Record payment
    await pool.query(
      `INSERT INTO fine_payments (fine_id, user_id, member_id, amount, payment_method, transaction_id, received_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, fine.user_id, fine.member_id, paymentAmount, payment_method, transaction_id, userId, notes]
    );

    // Update fine status
    const newStatus = paymentAmount >= fine.fine_amount ? 'paid' : 'partially_paid';
    await pool.query(
      `UPDATE fines SET fine_status = ?, payment_method = ?, payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, payment_method, id]
    );

    // Update user/member fine balance
    if (fine.user_id) {
      await pool.query(
        'UPDATE users SET total_fine_balance = MAX(0, total_fine_balance - ?) WHERE id = ?',
        [paymentAmount, fine.user_id]
      );
    }

    if (fine.member_id) {
      await pool.query(
        'UPDATE members SET total_fine_balance = MAX(0, total_fine_balance - ?) WHERE id = ?',
        [paymentAmount, fine.member_id]
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
        'UPDATE users SET total_fine_balance = MAX(0, total_fine_balance - ?) WHERE id = ?',
        [fine.fine_amount, fine.user_id]
      );
    }

    if (fine.member_id) {
      await pool.query(
        'UPDATE members SET total_fine_balance = MAX(0, total_fine_balance - ?) WHERE id = ?',
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
      dateFilter = "AND created_at >= date('now', '-30 days')";
    } else if (period === 'year') {
      dateFilter = "AND created_at >= date('now', '-365 days')";
    }

    // Get all stats in one query for efficiency
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_fines,
        COALESCE(SUM(CASE WHEN fine_status = 'paid' THEN fine_amount ELSE 0 END), 0) as paid_fines,
        COALESCE(SUM(CASE WHEN fine_status = 'unpaid' THEN fine_amount ELSE 0 END), 0) as unpaid_fines,
        COALESCE(SUM(CASE WHEN fine_status = 'waived' THEN fine_amount ELSE 0 END), 0) as waived_fines,
        COALESCE(SUM(CASE WHEN fine_status = 'partially_paid' THEN fine_amount ELSE 0 END), 0) as partially_paid_fines,
        COALESCE(SUM(fine_amount), 0) as total_amount
       FROM fines
       WHERE 1=1 ${dateFilter}`
    );

    // Fine by type
    const byTypeResult = await pool.query(
      `SELECT fine_type, COUNT(*) as count, COALESCE(SUM(fine_amount), 0) as total
       FROM fines
       WHERE 1=1 ${dateFilter}
       GROUP BY fine_type`
    );

    // Top defaulters
    const defaultersResult = await pool.query(
      `SELECT u.username, u.email, u.role, COUNT(f.id) as fine_count, COALESCE(SUM(f.fine_amount), 0) as total_fines
       FROM fines f
       JOIN users u ON f.user_id = u.id
       WHERE f.fine_status = 'unpaid'
       GROUP BY u.id, u.username, u.email, u.role
       ORDER BY total_fines DESC
       LIMIT 10`
    );

    const stats = statsResult.rows[0];

    res.json({
      total_fines: stats.total_amount,
      paid_fines: stats.paid_fines,
      unpaid_fines: stats.unpaid_fines,
      waived_fines: stats.waived_fines,
      partially_paid_fines: stats.partially_paid_fines,
      total_count: stats.total_fines,
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
// Get user's own fines list
export const getMyFines = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
        f.*,
        b.title as book_title,
        i.issue_date,
        i.due_date,
        i.return_date
       FROM fines f
       LEFT JOIN issues i ON f.issue_id = i.id
       LEFT JOIN books b ON i.book_id = b.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my fines error:', error);
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

    let targetUserId = user_id;

    // If user_id is provided, check if it's an actual ID (number) or look it up
    if (user_id && isNaN(parseInt(user_id))) {
      const userLookup = await pool.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [user_id, user_id]
      );
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ error: 'User not found by username or email' });
      }
      targetUserId = userLookup.rows[0].id;
    }

    // Create fine
    const result = await pool.query(
      `INSERT INTO fines (user_id, member_id, fine_amount, fine_type, fine_status, notes)
       VALUES (?, ?, ?, ?, 'unpaid', ?)`,
      [targetUserId, member_id, fine_amount, fine_type, notes]
    );

    // Get the ID for the response (lastID is for SQLite)
    const fineId = result.lastID;

    // Update balance
    if (targetUserId) {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
        [fine_amount, targetUserId]
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
      fine_id: fineId,
      user_id: targetUserId
    });
  } catch (error) {
    console.error('Create manual fine error:', error);
    res.status(500).json({ error: error.message });
  }
};


// Admin: Update fine amount
export const updateFineAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { fine_amount, notes } = req.body;

    if (fine_amount < 0) {
      return res.status(400).json({ error: 'Fine amount cannot be negative' });
    }

    // Get current fine
    const fineResult = await pool.query('SELECT * FROM fines WHERE id = ?', [id]);
    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const oldAmount = fineResult.rows[0].fine_amount;
    const difference = fine_amount - oldAmount;

    // Update fine with or without notes
    if (notes !== undefined && notes !== null) {
      await pool.query(
        'UPDATE fines SET fine_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [fine_amount, notes, id]
      );
    } else {
      await pool.query(
        'UPDATE fines SET fine_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [fine_amount, id]
      );
    }

    // Update user's total fine balance
    if (fineResult.rows[0].user_id) {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
        [difference, fineResult.rows[0].user_id]
      );
    }

    res.json({
      message: 'Fine amount updated successfully',
      old_amount: oldAmount,
      new_amount: fine_amount
    });
  } catch (error) {
    console.error('Update fine amount error:', error);
    res.status(500).json({ error: 'Failed to update fine amount' });
  }
};

// Admin: Change fine status
export const updateFineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['unpaid', 'partially_paid', 'paid', 'waived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query(
      'UPDATE fines SET fine_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({ message: `Fine status updated to ${status}` });
  } catch (error) {
    console.error('Update fine status error:', error);
    res.status(500).json({ error: 'Failed to update fine status' });
  }
};

// Admin: Delete fine
export const deleteFine = async (req, res) => {
  try {
    const { id } = req.params;

    // Get fine details
    const fineResult = await pool.query('SELECT * FROM fines WHERE id = ?', [id]);
    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const fine = fineResult.rows[0];

    // Update user's total fine balance
    if (fine.user_id && fine.fine_status !== 'paid') {
      await pool.query(
        'UPDATE users SET total_fine_balance = total_fine_balance - ? WHERE id = ?',
        [fine.fine_amount, fine.user_id]
      );
    }

    // Delete fine
    await pool.query('DELETE FROM fines WHERE id = ?', [id]);

    res.json({ message: 'Fine deleted successfully' });
  } catch (error) {
    console.error('Delete fine error:', error);
    res.status(500).json({ error: 'Failed to delete fine' });
  }
};

// Admin: Get fine details
export const getFineDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT f.*, 
              u.username, u.email, u.role,
              b.title as book_title,
              i.issue_date, i.due_date, i.return_date
       FROM fines f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN issues i ON f.issue_id = i.id
       LEFT JOIN books b ON i.book_id = b.id
       WHERE f.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    // Get payment history
    const payments = await pool.query(
      'SELECT * FROM fine_payments WHERE fine_id = ? ORDER BY payment_date DESC',
      [id]
    );

    res.json({
      fine: result.rows[0],
      payments: payments.rows
    });
  } catch (error) {
    console.error('Get fine details error:', error);
    res.status(500).json({ error: 'Failed to fetch fine details' });
  }
};

// Admin: Bulk waive fines
export const bulkWaiveFines = async (req, res) => {
  try {
    const { fine_ids, reason } = req.body;

    if (!Array.isArray(fine_ids) || fine_ids.length === 0) {
      return res.status(400).json({ error: 'Please provide fine IDs' });
    }

    let waivedCount = 0;
    const waiveReason = reason || 'Waived by admin';

    for (const fineId of fine_ids) {
      // Get fine details
      const fineResult = await pool.query('SELECT * FROM fines WHERE id = ?', [fineId]);

      if (fineResult.rows.length > 0) {
        const fine = fineResult.rows[0];

        // Only waive if not already paid or waived
        if (fine.fine_status !== 'paid' && fine.fine_status !== 'waived') {
          // Update fine status
          await pool.query(
            'UPDATE fines SET fine_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['waived', waiveReason, fineId]
          );

          // Update user's total fine balance
          if (fine.user_id) {
            await pool.query(
              'UPDATE users SET total_fine_balance = CASE WHEN total_fine_balance - ? < 0 THEN 0 ELSE total_fine_balance - ? END WHERE id = ?',
              [fine.fine_amount, fine.fine_amount, fine.user_id]
            );
          }

          waivedCount++;
        }
      }
    }

    res.json({
      message: `${waivedCount} fine(s) waived successfully`,
      waived_count: waivedCount
    });
  } catch (error) {
    console.error('Bulk waive fines error:', error);
    res.status(500).json({ error: 'Failed to waive fines' });
  }
};
