import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new pg.Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Attempting to add missing notes column to fines table...');
        await pool.query('ALTER TABLE fines ADD COLUMN notes TEXT;');
        console.log('✅ Success: Added "notes" column to "fines" table in PostgreSQL.');
    } catch (error) {
        if (error.code === '42701') {
            console.log('ℹ️ The column "notes" already exists.');
        } else {
            console.error('❌ Failed to update schema:', error.message);
        }
    } finally {
        pool.end();
    }
}

runMigration();
