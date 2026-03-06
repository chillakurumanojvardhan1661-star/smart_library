import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function addSampleFines() {
  console.log('📊 Adding sample fines to database...\n');

  try {
    const db = await open({
      filename: './library.db',
      driver: sqlite3.Database
    });

    // Get some users and books for creating sample issues with fines
    const users = await db.all('SELECT id, username, role FROM users WHERE role != "admin" LIMIT 3');
    const books = await db.all('SELECT id, title FROM books LIMIT 5');

    if (users.length === 0 || books.length === 0) {
      console.log('⚠️  No users or books found. Please add users and books first.');
      return;
    }

    // Sample overdue issues with fines
    const sampleIssues = [
      {
        book_id: books[0].id,
        user_id: users[0].id,
        issue_date: '2026-01-15',
        due_date: '2026-01-29',
        return_date: '2026-02-05',
        overdue_days: 7,
        fine_amount: 35.00,
        fine_status: 'unpaid',
        status: 'returned'
      },
      {
        book_id: books[1].id,
        user_id: users[1].id,
        issue_date: '2026-01-20',
        due_date: '2026-02-10',
        return_date: '2026-02-15',
        overdue_days: 5,
        fine_amount: 15.00,
        fine_status: 'unpaid',
        status: 'returned'
      },
      {
        book_id: books[2].id,
        user_id: users[2].id,
        issue_date: '2026-02-01',
        due_date: '2026-02-15',
        return_date: '2026-02-20',
        overdue_days: 5,
        fine_amount: 20.00,
        fine_status: 'paid',
        status: 'returned'
      },
      {
        book_id: books[3].id,
        user_id: users[0].id,
        issue_date: '2026-02-05',
        due_date: '2026-02-19',
        return_date: null,
        overdue_days: 1,
        fine_amount: 5.00,
        fine_status: 'unpaid',
        status: 'issued'
      },
      {
        book_id: books[4].id,
        user_id: users[1].id,
        issue_date: '2026-01-10',
        due_date: '2026-01-31',
        return_date: '2026-02-10',
        overdue_days: 10,
        fine_amount: 30.00,
        fine_status: 'partially_paid',
        status: 'returned'
      }
    ];

    let issuesAdded = 0;
    let finesAdded = 0;

    for (const issue of sampleIssues) {
      // Insert issue
      const issueResult = await db.run(
        `INSERT INTO issues (book_id, user_id, member_id, issue_date, due_date, return_date, 
         overdue_days, fine_amount, fine_status, status)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issue.book_id,
          issue.user_id,
          issue.issue_date,
          issue.due_date,
          issue.return_date,
          issue.overdue_days,
          issue.fine_amount,
          issue.fine_status,
          issue.status
        ]
      );

      issuesAdded++;

      // If there's a fine, create a fine record
      if (issue.fine_amount > 0) {
        await db.run(
          `INSERT INTO fines (issue_id, user_id, member_id, fine_amount, fine_type, 
           overdue_days, fine_status)
           VALUES (?, ?, NULL, ?, 'overdue', ?, ?)`,
          [
            issueResult.lastID,
            issue.user_id,
            issue.fine_amount,
            issue.overdue_days,
            issue.fine_status
          ]
        );

        finesAdded++;

        // Update user's total fine balance
        await db.run(
          'UPDATE users SET total_fine_balance = total_fine_balance + ? WHERE id = ?',
          [issue.fine_status === 'paid' ? 0 : issue.fine_amount, issue.user_id]
        );

        console.log(`✅ Added fine: $${issue.fine_amount} for user ${users.find(u => u.id === issue.user_id).username}`);
      }
    }

    // Add some payment records for paid/partially paid fines
    const paidFines = await db.all('SELECT * FROM fines WHERE fine_status IN ("paid", "partially_paid")');
    
    for (const fine of paidFines) {
      const paymentAmount = fine.fine_status === 'paid' ? fine.fine_amount : fine.fine_amount / 2;
      
      await db.run(
        `INSERT INTO fine_payments (fine_id, user_id, amount, payment_method)
         VALUES (?, ?, ?, 'cash')`,
        [fine.id, fine.user_id, paymentAmount]
      );

      console.log(`💰 Added payment: $${paymentAmount} for fine #${fine.id}`);
    }

    await db.close();

    console.log('\n============================================================');
    console.log(`📊 Summary:`);
    console.log(`✅ Issues added: ${issuesAdded}`);
    console.log(`✅ Fines created: ${finesAdded}`);
    console.log(`✅ Payments recorded: ${paidFines.length}`);
    console.log('============================================================\n');
    console.log('🎉 Sample fines added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample fines:', error);
    process.exit(1);
  }
}

addSampleFines();
