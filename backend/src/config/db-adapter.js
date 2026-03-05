import dotenv from 'dotenv';
dotenv.config();

let dbInstance;

if (process.env.USE_SQLITE === 'true') {
  const { getDb } = await import('./database-sqlite.js');
  dbInstance = {
    query: async (sql, params = []) => {
      const db = getDb();

      // If the same parameter index is used multiple times (e.g., $7, $7),
      // we need to make sure the SQLite ? parameters match the count and values.
      const paramMatches = sql.match(/\$(\d+)/g) || [];

      let mappedParams = params;
      let sqliteSql = sql;

      if (paramMatches.length > 0) {
        const usedIndices = paramMatches.map(m => parseInt(m.substring(1)));

        // Transform PostgreSQL $1, $2 to SQLite ?
        // If the original SQL has $1, $1, we need to duplicate the first param in the new array
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
  const pgModule = await import('./database.js');
  dbInstance = pgModule.default;
}

export default dbInstance;
