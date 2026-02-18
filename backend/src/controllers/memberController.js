import pool from '../config/db-adapter.js';

export const getAllMembers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMember = async (req, res) => {
  try {
    const { member_id, name, email, phone, address } = req.body;
    
    const result = await pool.query(
      `INSERT INTO members (member_id, name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [member_id, name, email, phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status } = req.body;
    
    const result = await pool.query(
      `UPDATE members SET name = $1, email = $2, phone = $3, address = $4, 
       status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [name, email, phone, address, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMemberHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT i.*, b.title, b.author FROM issues i
       JOIN books b ON i.book_id = b.id
       WHERE i.member_id = $1 ORDER BY i.issue_date DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
