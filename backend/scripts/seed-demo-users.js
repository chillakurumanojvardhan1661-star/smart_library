import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Inject Postgres URL for local execution
process.env.POSTGRES_URL = "postgres://d8f6a2fe275c54d6dfd09ace0ec53e3cfc862d035c81f041ac86d0a26cff0c8d:sk_Vf52F4hogUjASTP_yZ4t-@db.prisma.io:5432/postgres?sslmode=require";

// Load production environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

async function seedUsers() {
    const { default: pool } = await import('../src/config/db-adapter.js');
    console.log('Seeding missing demo users (Faculty, Student, Staff)...');
    try {
        const passwordHashFaculty = await bcrypt.hash('faculty123', 10);
        await pool.query(
            "INSERT INTO users (username, email, password_hash, role, status, employee_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
            ['faculty_demo', 'faculty@library.com', passwordHashFaculty, 'faculty', 'active', 'FAC-001']
        );

        const passwordHashStudent = await bcrypt.hash('student123', 10);
        await pool.query(
            "INSERT INTO users (username, email, password_hash, role, status, student_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
            ['student_demo', 'student@library.com', passwordHashStudent, 'student', 'active', 'STU-001']
        );

        const passwordHashStaff = await bcrypt.hash('staff123', 10);
        await pool.query(
            "INSERT INTO users (username, email, password_hash, role, status, employee_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
            ['staff_demo', 'staff@library.com', passwordHashStaff, 'staff', 'active', 'STA-001']
        );

        console.log('✅ Demo users seeded successfully!');
    } catch (e) {
        console.error('❌ Error seeding users:', e);
    }
}

seedUsers();
