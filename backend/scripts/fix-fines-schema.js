import pool from '../src/config/db-adapter.js';
import { initDatabase } from '../src/config/database-sqlite.js';

/**
 * Fix Fines Database Schema
 * Adds missing columns and ensures data integrity
 */

async function fixFinesSchema() {
  try {
    console.log('🔧 Fixing fines database schema...\n');
    
    // Initialize database first
    await initDatabase();
    console.log('✅ Database initialized\n');

    // Check if notes column exists
    const columnsResult = await pool.query("PRAGMA table_info(fines)");
    const columns = columnsResult.rows.map(col => col.name);
    
    console.log('Current columns:', columns.join(', '), '\n');
    
    // Add notes column if missing
    if (!columns.includes('notes')) {
      console.log('➕ Adding notes column...');
      try {
        await pool.query('ALTER TABLE fines ADD COLUMN notes TEXT');
        console.log('✅ Notes column added');
      } catch (error) {
        if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column')) {
          console.log('✅ Notes column already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Notes column already exists');
    }
    
    // Add fine_date column if missing
    if (!columns.includes('fine_date')) {
      console.log('➕ Adding fine_date column...');
      try {
        await pool.query('ALTER TABLE fines ADD COLUMN fine_date DATE');
        console.log('✅ Fine_date column added');
        
        // Update existing records
        console.log('📝 Updating existing records with fine_date...');
        await pool.query("UPDATE fines SET fine_date = date(created_at) WHERE fine_date IS NULL");
        console.log('✅ Existing records updated');
      } catch (error) {
        if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column')) {
          console.log('✅ Fine_date column already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Fine_date column already exists');
      
      // Update any NULL fine_date values
      const nullDatesResult = await pool.query("SELECT COUNT(*) as count FROM fines WHERE fine_date IS NULL");
      if (nullDatesResult.rows[0].count > 0) {
        console.log(`📝 Updating ${nullDatesResult.rows[0].count} records with NULL fine_date...`);
        await pool.query("UPDATE fines SET fine_date = date(created_at) WHERE fine_date IS NULL");
        console.log('✅ NULL dates updated');
      }
    }
    
    // Verify data integrity
    console.log('\n📊 Verifying data integrity...');
    
    // Check for negative fine amounts
    const negativeResult = await pool.query("SELECT COUNT(*) as count FROM fines WHERE fine_amount < 0");
    if (negativeResult.rows[0].count > 0) {
      console.log(`⚠️  Found ${negativeResult.rows[0].count} fines with negative amounts`);
      await pool.query("UPDATE fines SET fine_amount = 0 WHERE fine_amount < 0");
      console.log('✅ Fixed negative amounts');
    }
    
    // Check for invalid statuses
    const validStatuses = ['unpaid', 'paid', 'partially_paid', 'waived'];
    const invalidStatusResult = await pool.query(
      `SELECT COUNT(*) as count FROM fines WHERE fine_status NOT IN (${validStatuses.map(() => '?').join(',')})`,
      validStatuses
    );
    if (invalidStatusResult.rows[0].count > 0) {
      console.log(`⚠️  Found ${invalidStatusResult.rows[0].count} fines with invalid status`);
      await pool.query("UPDATE fines SET fine_status = 'unpaid' WHERE fine_status NOT IN ('unpaid', 'paid', 'partially_paid', 'waived')");
      console.log('✅ Fixed invalid statuses');
    }
    
    // Verify user fine balances
    console.log('\n💰 Verifying user fine balances...');
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.total_fine_balance as current_balance,
        COALESCE(SUM(CASE WHEN f.fine_status IN ('unpaid', 'partially_paid') THEN f.fine_amount ELSE 0 END), 0) as calculated_balance
      FROM users u
      LEFT JOIN fines f ON u.id = f.user_id
      GROUP BY u.id, u.username, u.total_fine_balance
      HAVING ABS(current_balance - calculated_balance) > 0.01
    `);
    
    if (usersResult.rows.length > 0) {
      console.log(`⚠️  Found ${usersResult.rows.length} users with incorrect fine balances`);
      for (const user of usersResult.rows) {
        await pool.query(
          'UPDATE users SET total_fine_balance = ? WHERE id = ?',
          [user.calculated_balance, user.id]
        );
        console.log(`  ✓ Fixed balance for ${user.username}: $${user.current_balance} → $${user.calculated_balance}`);
      }
    } else {
      console.log('✅ All user balances are correct');
    }
    
    // Display summary
    console.log('\n📈 Database Summary:');
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_fines,
        SUM(CASE WHEN fine_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN fine_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN fine_status = 'waived' THEN 1 ELSE 0 END) as waived_count,
        SUM(CASE WHEN fine_status = 'partially_paid' THEN 1 ELSE 0 END) as partial_count,
        COALESCE(SUM(fine_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN fine_status = 'unpaid' THEN fine_amount ELSE 0 END), 0) as unpaid_amount,
        COALESCE(SUM(CASE WHEN fine_status = 'paid' THEN fine_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN fine_status = 'waived' THEN fine_amount ELSE 0 END), 0) as waived_amount
      FROM fines
    `);
    
    const summary = summaryResult.rows[0];
    console.log(`  Total Fines: ${summary.total_fines}`);
    console.log(`  - Unpaid: ${summary.unpaid_count} ($${summary.unpaid_amount})`);
    console.log(`  - Paid: ${summary.paid_count} ($${summary.paid_amount})`);
    console.log(`  - Waived: ${summary.waived_count} ($${summary.waived_amount})`);
    console.log(`  - Partially Paid: ${summary.partial_count}`);
    console.log(`  Total Amount: $${summary.total_amount}`);
    
    console.log('\n✅ Schema fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  }
}

// Run the script
fixFinesSchema()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
