import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Using SQLite fallback.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Database adapter for Supabase
export const supabaseAdapter = {
  query: async (sql, params = []) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Parse SQL to determine operation
    const sqlUpper = sql.trim().toUpperCase();
    
    try {
      if (sqlUpper.startsWith('SELECT')) {
        return await executeSelect(sql, params);
      } else if (sqlUpper.startsWith('INSERT')) {
        return await executeInsert(sql, params);
      } else if (sqlUpper.startsWith('UPDATE')) {
        return await executeUpdate(sql, params);
      } else if (sqlUpper.startsWith('DELETE')) {
        return await executeDelete(sql, params);
      } else {
        // For other operations, use RPC or raw SQL
        const { data, error } = await supabase.rpc('execute_sql', { 
          query: sql, 
          params 
        });
        
        if (error) throw error;
        return { rows: data || [], rowCount: data?.length || 0 };
      }
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  },

  connect: async () => ({
    query: supabaseAdapter.query,
    release: () => {},
  }),
};

// Helper functions to convert SQL to Supabase queries
async function executeSelect(sql, params) {
  // Extract table name from SQL
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (!tableMatch) throw new Error('Could not parse table name');
  
  const tableName = tableMatch[1];
  let query = supabase.from(tableName).select('*');
  
  // Add WHERE conditions if present
  if (sql.includes('WHERE')) {
    // This is simplified - you may need more complex parsing
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
    if (whereMatch) {
      const condition = whereMatch[1].trim();
      // Parse simple conditions like "id = ?" or "status = ?"
      const condMatch = condition.match(/(\w+)\s*=\s*\?/);
      if (condMatch && params.length > 0) {
        query = query.eq(condMatch[1], params[0]);
      }
    }
  }
  
  // Add ORDER BY if present
  if (sql.includes('ORDER BY')) {
    const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const ascending = !orderMatch[2] || orderMatch[2].toUpperCase() === 'ASC';
      query = query.order(orderMatch[1], { ascending });
    }
  }
  
  // Add LIMIT if present
  if (sql.includes('LIMIT')) {
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return { rows: data || [], rowCount: data?.length || 0 };
}

async function executeInsert(sql, params) {
  const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
  if (!tableMatch) throw new Error('Could not parse table name');
  
  const tableName = tableMatch[1];
  const columnsMatch = sql.match(/\(([^)]+)\)/);
  
  if (!columnsMatch) throw new Error('Could not parse columns');
  
  const columns = columnsMatch[1].split(',').map(c => c.trim());
  const insertData = {};
  
  columns.forEach((col, idx) => {
    if (params[idx] !== undefined) {
      insertData[col] = params[idx];
    }
  });
  
  const { data, error } = await supabase
    .from(tableName)
    .insert(insertData)
    .select();
  
  if (error) throw error;
  
  return { 
    rows: data || [], 
    rowCount: data?.length || 0,
    lastID: data?.[0]?.id 
  };
}

async function executeUpdate(sql, params) {
  const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (!tableMatch) throw new Error('Could not parse table name');
  
  const tableName = tableMatch[1];
  const setMatch = sql.match(/SET\s+(.+?)(?:WHERE|$)/i);
  const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
  
  if (!setMatch) throw new Error('Could not parse SET clause');
  
  // Parse SET clause
  const updateData = {};
  const setClause = setMatch[1].trim();
  const assignments = setClause.split(',');
  let paramIndex = 0;
  
  assignments.forEach(assignment => {
    const [column] = assignment.split('=').map(s => s.trim());
    if (params[paramIndex] !== undefined) {
      updateData[column] = params[paramIndex];
      paramIndex++;
    }
  });
  
  let query = supabase.from(tableName).update(updateData);
  
  // Add WHERE condition
  if (whereMatch && params[paramIndex] !== undefined) {
    const condition = whereMatch[1].trim();
    const condMatch = condition.match(/(\w+)\s*=\s*\?/);
    if (condMatch) {
      query = query.eq(condMatch[1], params[paramIndex]);
    }
  }
  
  const { data, error } = await query.select();
  if (error) throw error;
  
  return { rows: data || [], rowCount: data?.length || 0 };
}

async function executeDelete(sql, params) {
  const tableMatch = sql.match(/DELETE FROM\s+(\w+)/i);
  if (!tableMatch) throw new Error('Could not parse table name');
  
  const tableName = tableMatch[1];
  const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
  
  let query = supabase.from(tableName).delete();
  
  if (whereMatch && params.length > 0) {
    const condition = whereMatch[1].trim();
    const condMatch = condition.match(/(\w+)\s*=\s*\?/);
    if (condMatch) {
      query = query.eq(condMatch[1], params[0]);
    }
  }
  
  const { data, error } = await query.select();
  if (error) throw error;
  
  return { rows: data || [], rowCount: data?.length || 0 };
}

export default supabase;
