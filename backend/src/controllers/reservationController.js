import pool from '../config/db-adapter.js';

// Create a reservation (Student, Faculty, Staff only)
export const createReservation = async (req, res) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // Check if book exists and has available copies
    const bookResult = await pool.query('SELECT * FROM books WHERE id = ?', [book_id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if user already has a pending reservation for this book
    const existingResult = await pool.query(
      'SELECT * FROM reservations WHERE book_id = ? AND user_id = ? AND status = ?',
      [book_id, user_id, 'pending']
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending reservation for this book' });
    }

    // Create reservation
    const result = await pool.query(
      `INSERT INTO reservations (book_id, user_id, status, reservation_date) 
       VALUES (?, ?, 'pending', DATE('now'))`,
      [book_id, user_id]
    );

    res.status(201).json({
      message: 'Reservation created successfully. Waiting for admin approval.',
      reservation_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
};

// Get user's reservations
export const getUserReservations = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT r.*, b.title, b.author, b.isbn, b.available_copies
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ?
       ORDER BY r.reservation_date DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

// Get all reservations (Admin only)
export const getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT r.*, 
             b.title, b.author, b.isbn, b.available_copies,
             u.username, u.email, u.role
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.reservation_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

// Approve reservation and issue book (Admin only)
export const approveReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reservation details
    const reservationResult = await pool.query(
      `SELECT r.*, b.available_copies, u.role, u.username
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = reservationResult.rows[0];

    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not pending' });
    }

    if (reservation.available_copies < 1) {
      return res.status(400).json({ error: 'No copies available' });
    }

    // Get role-based due days
    const roleResult = await pool.query('SELECT due_days FROM roles WHERE role_name = ?', [reservation.role]);
    const dueDays = roleResult.rows.length > 0 ? roleResult.rows[0].due_days : 14;

    // Create issue record (member_id can be NULL, we use user_id)
    await pool.query(
      `INSERT INTO issues (book_id, member_id, user_id, issue_date, due_date, status)
       VALUES (?, NULL, ?, DATE('now'), DATE('now', '+${dueDays} days'), 'issued')`,
      [reservation.book_id, reservation.user_id]
    );

    // Update book available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [reservation.book_id]
    );

    // Update reservation status
    await pool.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['approved', id]
    );

    res.json({ message: 'Reservation approved and book issued successfully' });
  } catch (error) {
    console.error('Approve reservation error:', error);
    res.status(500).json({ error: 'Failed to approve reservation' });
  }
};

// Reject reservation (Admin only)
export const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = result.rows[0];
    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not pending' });
    }

    await pool.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['rejected', id]
    );

    res.json({ message: 'Reservation rejected' });
  } catch (error) {
    console.error('Reject reservation error:', error);
    res.status(500).json({ error: 'Failed to reject reservation' });
  }
};

// Cancel reservation (User can cancel their own pending reservation)
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = result.rows[0];
    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending reservations' });
    }

    await pool.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    res.json({ message: 'Reservation cancelled' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};
