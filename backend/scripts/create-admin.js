import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function createAdmin() {
  const db = await open({
    filename: './library.db',
    driver: sqlite3.Database
  });

  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@library.com', passwordHash, 'admin']
    );
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@library.com');
    console.log('Password: admin123');
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      console.log('ℹ️  Admin user already exists');
    } else {
      console.error('Error:', error.message);
    }
  }

  await db.close();
}

createAdmin();
