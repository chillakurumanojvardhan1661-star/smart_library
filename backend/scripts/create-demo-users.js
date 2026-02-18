import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function createDemoUsers() {
  const db = await open({
    filename: './library.db',
    driver: sqlite3.Database
  });

  const users = [
    {
      username: 'admin',
      email: 'admin@library.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
      status: 'active'
    },
    {
      username: 'faculty_user',
      email: 'faculty@library.com',
      password: 'faculty123',
      role: 'faculty',
      department: 'Computer Science',
      employee_id: 'FAC2024001',
      status: 'active'
    },
    {
      username: 'student_user',
      email: 'student@library.com',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      student_id: 'STU2024001',
      status: 'active'
    },
    {
      username: 'staff_user',
      email: 'staff@library.com',
      password: 'staff123',
      role: 'staff',
      department: 'Library Services',
      employee_id: 'STA2024001',
      status: 'active'
    }
  ];

  console.log('🔐 Creating demo users...\n');

  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await db.get(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );

      if (existing) {
        console.log(`ℹ️  ${user.role.toUpperCase()} user already exists: ${user.email}`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Insert user
      await db.run(
        `INSERT INTO users (username, email, password_hash, role, department, employee_id, student_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.email,
          passwordHash,
          user.role,
          user.department,
          user.employee_id || null,
          user.student_id || null,
          user.status
        ]
      );

      console.log(`✅ Created ${user.role.toUpperCase()} user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error creating ${user.role} user:`, error.message);
    }
  }

  await db.close();

  console.log('\n🎉 Demo users setup complete!\n');
  console.log('📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin:   admin@library.com   / admin123');
  console.log('👩‍🏫 Faculty: faculty@library.com / faculty123');
  console.log('🎓 Student: student@library.com / student123');
  console.log('🏢 Staff:   staff@library.com   / staff123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createDemoUsers().catch(console.error);
