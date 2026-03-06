import pool from '../src/config/db-adapter.js';
import { calculateFine } from '../src/controllers/fineController.js';

/**
 * Automated Fine Calculation Script
 * Run this script daily (via cron job) to automatically calculate and create fines for overdue books
 */

async function autoCalculateFines() {
  try {
    console.log('🔍 Checking for overdue books...');
    
    // Get all issued books that are overdue
    const overdueResult = await pool.query(
      `SELECT i.*, u.id as user_id, u.username, u.role, b.title
       FROM issues i
       JOIN users u ON i.user_id = u.id
       JOIN books b ON i.book_id = b.id
       WHERE i.status = 'issued' 
       AND date(i.due_date) < date('now')
       AND i.id NOT IN (SELECT issue_id FROM fines WHERE issue_id IS NOT NULL)`
    );

    const overdueBooks = overdueResult.rows;
    
    if (overdueBooks.length === 0) {
      console.log('✅ No new overdue books found.');
      return;
    }

    console.log(`📚 Found ${overdueBooks.length} overdue book(s). Calculating fines...`);

    let finesCreated = 0;
    let totalFineAmount = 0;

    for (const issue of overdueBooks) {
      const dueDate = new Date(issue.due_date);
      const today = new Date();
      const diffTime = today - dueDate;
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (overdueDays <= 0) continue;

      // Calculate fine based on user role
      const fineCalculation = await calculateFine(issue.user_id, overdueDays);
      const fineAmount = fineCalculation.fineAmount;

      if (fineAmount > 0) {
        // Create fine record
        await pool.query(
          `INSERT INTO fines (issue_id, user_id, fine_amount, fine_type, overdue_days, fine_status, notes, fine_date)
           VALUES (?, ?, ?, 'overdue', ?, 'unpaid', ?, date('now'))`,
          [
            issue.id,
            issue.user_id,
            fineAmount,
            overdueDays,
            `Auto-generated fine for overdue book: ${issue.title}`
          ]
        );

        // Update user's total fine balance
        await pool.query(
          'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
          [fineAmount, issue.user_id]
        );

        // Update issue record
        await pool.query(
          `UPDATE issues 
           SET overdue_days = ?, fine_amount = ?, fine_status = 'unpaid'
           WHERE id = ?`,
          [overdueDays, fineAmount, issue.id]
        );

        finesCreated++;
        totalFineAmount += fineAmount;

        console.log(`  ✓ Fine created for ${issue.username}: $${fineAmount} (${overdueDays} days overdue)`);
      }
    }

    console.log(`\n✅ Automated fine calculation complete!`);
    console.log(`   - Fines created: ${finesCreated}`);
    console.log(`   - Total amount: $${totalFineAmount.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error calculating fines:', error);
    throw error;
  }
}

// Run the script
autoCalculateFines()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
