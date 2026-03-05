import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

let db;

export const initDatabase = async () => {
  db = await open({
    filename: './library.db',
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT,
      publisher TEXT,
      publication_year INTEGER,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      price DECIMAL(10, 2) DEFAULT 0,
      cover_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      membership_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'active',
      total_fine_balance DECIMAL(10, 2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      member_id INTEGER,
      user_id INTEGER,
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE NOT NULL,
      return_date DATE,
      overdue_days INTEGER DEFAULT 0,
      fine_amount DECIMAL(10, 2) DEFAULT 0,
      fine_status TEXT DEFAULT 'unpaid',
      fine_type TEXT DEFAULT 'overdue',
      status TEXT DEFAULT 'issued',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS fines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER,
      user_id INTEGER,
      member_id INTEGER,
      fine_amount DECIMAL(10, 2) NOT NULL,
      fine_type TEXT DEFAULT 'overdue',
      overdue_days INTEGER DEFAULT 0,
      fine_status TEXT DEFAULT 'unpaid',
      payment_method TEXT,
      payment_date DATETIME,
      waived_by INTEGER,
      waived_reason TEXT,
      waived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (waived_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fine_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fine_id INTEGER,
      user_id INTEGER,
      member_id INTEGER,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_by INTEGER,
      notes TEXT,
      FOREIGN KEY (fine_id) REFERENCES fines(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      description TEXT,
      max_books INTEGER DEFAULT 5,
      due_days INTEGER DEFAULT 14,
      fine_rate DECIMAL(10, 2) DEFAULT 5.00,
      grace_days INTEGER DEFAULT 0,
      max_fine_cap DECIMAL(10, 2) DEFAULT 500.00,
      fine_limit_for_suspension DECIMAL(10, 2) DEFAULT 500.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      department TEXT,
      employee_id TEXT,
      student_id TEXT,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      total_fine_balance DECIMAL(10, 2) DEFAULT 0,
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      user_id INTEGER,
      reservation_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'pending',
      notified BOOLEAN DEFAULT 0,
      expires_at DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS book_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      book_title TEXT,
      author TEXT,
      isbn TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(fine_status);
    CREATE INDEX IF NOT EXISTS idx_fines_user ON fines(user_id);
  `);

  // Insert default roles with fine management settings
  await db.run(`
    INSERT OR IGNORE INTO roles (role_name, description, max_books, due_days, fine_rate, grace_days, max_fine_cap, fine_limit_for_suspension) VALUES
    ('admin', 'Full system access', 999, 365, 0.00, 0, 0.00, 0.00),
    ('faculty', 'Extended borrowing privileges', 10, 30, 3.00, 2, 500.00, 1000.00),
    ('student', 'Standard user access', 5, 14, 5.00, 1, 500.00, 500.00),
    ('staff', 'Medium access level', 5, 21, 4.00, 1, 500.00, 750.00)
  `);

  console.log('✅ SQLite Database initialized');
  return db;
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export default { initDatabase, getDb };
