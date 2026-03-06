import dotenv from 'dotenv';
dotenv.config();

let dbInstance;

// ALWAYS prioritize PostgreSQL if the URL is present (Vercel Production)
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  console.log('🐘 Production Environment detected: Using PostgreSQL');
  const pgModule = await import('./database.js');
  dbInstance = pgModule.default;
} else if (process.env.USE_SQLITE === 'true') {
  console.log('📦 Development Environment detected: Using SQLite');
  const { getDb } = await import('./database-sqlite.js');
  dbInstance = {
    query: async (sql, params = []) => {
      const db = getDb();
      const paramMatches = sql.match(/\$(\d+)/g) || [];
      let mappedParams = params;
      let sqliteSql = sql;

      if (paramMatches.length > 0) {
        const usedIndices = paramMatches.map(m => parseInt(m.substring(1)));
        mappedParams = usedIndices.map(index => params[index - 1]);
        sqliteSql = sql.replace(/\$(\d+)/g, '?');
      }

      if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await db.all(sqliteSql, mappedParams);
        return { rows };
      } else {
        const result = await db.run(sqliteSql, mappedParams);
        return { rows: [{ id: result.lastID }], rowCount: result.changes };
      }
    },
    connect: async () => ({
      query: dbInstance.query,
      release: () => { },
    }),
  };
} else {
  // Default to PostgreSQL just in case, or show error
  console.log('🐘 No DB environment set, defaulting to PostgreSQL');
  const pgModule = await import('./database.js');
  dbInstance = pgModule.default;
}

export default dbInstance;
