import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

// Vercel Postgres automatically injects POSTGRES_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrateDatabase() {
    console.log('🔄 Smaert Library Management - Vercel Postgres Migration Started');

    const client = await pool.connect();

    try {
        // 1. Create Users Table
        console.log('📝 Creating users table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        department VARCHAR(255),
        employee_id VARCHAR(100),
        student_id VARCHAR(100),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        total_fine_balance DECIMAL(10, 2) DEFAULT 0,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rejection_reason TEXT,
        suspension_reason TEXT
      );
    `);

        // 2. Create Books Table
        console.log('📝 Creating books table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        isbn VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        publisher VARCHAR(255),
        publication_year INTEGER,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 3. Create Members Table (Legacy Support)
        console.log('📝 Creating members table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        membership_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'active',
        total_fine_balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 4. Create Issues Table
        console.log('📝 Creating issues table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        issue_date DATE DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        overdue_days INTEGER DEFAULT 0,
        fine_amount DECIMAL(10, 2) DEFAULT 0,
        fine_status VARCHAR(50) DEFAULT 'unpaid',
        fine_type VARCHAR(50) DEFAULT 'overdue',
        status VARCHAR(50) DEFAULT 'issued',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 5. Create Fines Table
        console.log('📝 Creating fines table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        fine_amount DECIMAL(10, 2) NOT NULL,
        fine_type VARCHAR(50) DEFAULT 'overdue',
        overdue_days INTEGER DEFAULT 0,
        fine_status VARCHAR(50) DEFAULT 'unpaid',
        payment_method VARCHAR(100),
        payment_date TIMESTAMP,
        waived_by INTEGER REFERENCES users(id),
        waived_reason TEXT,
        waived_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 6. Create Fine Payments Table
        console.log('📝 Creating fine_payments table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS fine_payments (
        id SERIAL PRIMARY KEY,
        fine_id INTEGER REFERENCES fines(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        member_id INTEGER REFERENCES members(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        transaction_id VARCHAR(255),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        received_by INTEGER REFERENCES users(id),
        notes TEXT
      );
    `);

        // 7. Create Roles Table
        console.log('📝 Creating roles table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        max_books INTEGER DEFAULT 5,
        due_days INTEGER DEFAULT 14,
        fine_rate DECIMAL(10, 2) DEFAULT 5.00,
        grace_days INTEGER DEFAULT 0,
        max_fine_cap DECIMAL(10, 2) DEFAULT 500.00,
        fine_limit_for_suspension DECIMAL(10, 2) DEFAULT 500.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 8. Create Reservations Table
        console.log('📝 Creating reservations table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reservation_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'pending',
        notified BOOLEAN DEFAULT FALSE,
        expires_at DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 9. Create Book Requests Table
        console.log('📝 Creating book_requests table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS book_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        book_title VARCHAR(255),
        author VARCHAR(255),
        isbn VARCHAR(50),
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Insert Default Roles
        console.log('🔑 Inserting default roles...');
        await client.query(`
      INSERT INTO roles (role_name, description, max_books, due_days, fine_rate, grace_days, max_fine_cap, fine_limit_for_suspension) 
      VALUES 
        ('admin', 'Full system access', 999, 365, 0.00, 0, 0.00, 0.00),
        ('faculty', 'Extended borrowing privileges', 10, 30, 3.00, 2, 500.00, 1000.00),
        ('student', 'Standard user access', 5, 14, 5.00, 1, 500.00, 500.00),
        ('staff', 'Medium access level', 5, 21, 4.00, 1, 500.00, 750.00)
      ON CONFLICT (role_name) DO NOTHING;
    `);

        // Create Initial Admin User
        const adminCheck = await client.query("SELECT id FROM users WHERE email = 'admin@library.com'");
        if (adminCheck.rows.length === 0) {
            console.log('👨‍💼 Creating default admin user...');
            const passwordHash = await bcrypt.hash('admin123', 10);
            await client.query(
                "INSERT INTO users (username, email, password_hash, role, status, department) VALUES ($1, $2, $3, $4, $5, $6)",
                ['admin', 'admin@library.com', passwordHash, 'admin', 'active', 'Administration']
            );
        } else {
            console.log('ℹ️ Default admin already exists.');
        }

        console.log('✅✅✅ Migration Completed Successfully!');

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrateDatabase();
