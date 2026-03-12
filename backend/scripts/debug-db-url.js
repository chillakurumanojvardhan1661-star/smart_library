import pg from 'pg';
const { Pool } = pg;

const url = "postgres://d8f6a2fe275c54d6dfd09ace0ec53e3cfc862d035c81f041ac86d0a26cff0c8d:sk_Vf52F4hogUjASTP_yZ4t-@db.prisma.io:5432/postgres?sslmode=require";

try {
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT current_user');
    console.log('Result:', res.rows[0]);
    client.release();
    await pool.end();
} catch (err) {
    console.error('❌ Connection failed:', err);
}
