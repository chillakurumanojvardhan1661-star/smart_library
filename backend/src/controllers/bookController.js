import pool from '../config/db-adapter.js';

export const getAllBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      query += ` AND (title LIKE $${params.length - 1} OR author LIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY title';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const { isbn, title, author, category, publisher, publication_year, total_copies, cover_image_url } = req.body;

    const result = await pool.query(
      `INSERT INTO books (isbn, title, author, category, publisher, publication_year, total_copies, available_copies, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8) RETURNING *`,
      [isbn, title, author, category, publisher, publication_year, parseInt(total_copies) || 1, cover_image_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, publisher, publication_year, total_copies, cover_image_url } = req.body;

    // Calculate new availability if total_copies changed
    const currentBook = await pool.query('SELECT total_copies, available_copies FROM books WHERE id = $1', [id]);
    if (currentBook.rows.length === 0) return res.status(404).json({ error: 'Book not found' });

    const diff = parseInt(total_copies) - currentBook.rows[0].total_copies;
    const newAvailable = Math.max(0, currentBook.rows[0].available_copies + diff);

    const result = await pool.query(
      `UPDATE books SET title = $1, author = $2, category = $3, publisher = $4, 
       publication_year = $5, total_copies = $6, available_copies = $7, cover_image_url = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [title, author, category, publisher, publication_year, parseInt(total_copies), newAvailable, cover_image_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
