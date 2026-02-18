import dotenv from 'dotenv';
dotenv.config();

let dbInstance;

if (process.env.USE_SQLITE === 'true') {
  const { getDb } = await import('./database-sqlite.js');
  dbInstance = {
    query: async (sql, params = []) => {
      const db = getDb();
      // Convert PostgreSQL $1, $2 to SQLite ?
      const sqliteSql = sql.replace(/\$(\d+)/g, '?');
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await db.all(sqliteSql, params);
        return { rows };
      } else {
        const result = await db.run(sqliteSql, params);
        return { rows: [{ id: result.lastID }], rowCount: result.changes };
      }
    },
    connect: async () => ({
      query: dbInstance.query,
      release: () => {},
    }),
  };
} else {
  const pgModule = await import('./database.js');
  dbInstance = pgModule.default;
}

export default dbInstance;
