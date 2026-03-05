import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Vercel Postgres automatically injects POSTGRES_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Vercel Postgres connections
  }
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

export default {
  query: async (sql, params = []) => {
    let pgSql = sql;
    // Auto-convert SQLite ? parameters to PostgreSQL $1, $2
    if (typeof pgSql === 'string' && pgSql.includes('?')) {
      let i = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
    }
    return pool.query(pgSql, params);
  },
  connect: () => pool.connect(),
  on: (event, listener) => pool.on(event, listener)
};
