import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function addBooks() {
  const db = await open({
    filename: './library.db',
    driver: sqlite3.Database
  });

  const books = [
    // Classic Fiction
    { isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', publisher: 'J.B. Lippincott & Co.', year: 1960, copies: 5 },
    { isbn: '9780451524935', title: '1984', author: 'George Orwell', category: 'Fiction', publisher: 'Secker & Warburg', year: 1949, copies: 6 },
    { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Fiction', publisher: 'T. Egerton', year: 1813, copies: 4 },
    { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', publisher: "Charles Scribner's Sons", year: 1925, copies: 5 },
    { isbn: '9781503280786', title: 'Moby-Dick', author: 'Herman Melville', category: 'Fiction', publisher: 'Harper & Brothers', year: 1851, copies: 3 },
    { isbn: '9780199232765', title: 'War and Peace', author: 'Leo Tolstoy', category: 'Fiction', publisher: 'The Russian Messenger', year: 1869, copies: 3 },
    { isbn: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', publisher: 'Little, Brown and Company', year: 1951, copies: 4 },
    
    // Fantasy
    { isbn: '9780547928227', title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', publisher: 'George Allen & Unwin', year: 1937, copies: 6 },
    { isbn: '9780618640157', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', category: 'Fantasy', publisher: 'George Allen & Unwin', year: 1954, copies: 6 },
    { isbn: '9780590353427', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', category: 'Fantasy', publisher: 'Bloomsbury', year: 1997, copies: 8 },
    { isbn: '9780064471190', title: 'The Chronicles of Narnia', author: 'C.S. Lewis', category: 'Fantasy', publisher: 'Geoffrey Bles', year: 1956, copies: 5 },
    
    // Contemporary Fiction
    { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', publisher: 'HarperTorch', year: 1988, copies: 5 },
    { isbn: '9781594631931', title: 'The Kite Runner', author: 'Khaled Hosseini', category: 'Fiction', publisher: 'Riverhead Books', year: 2003, copies: 4 },
    { isbn: '9780375842207', title: 'The Book Thief', author: 'Markus Zusak', category: 'Fiction', publisher: 'Picador', year: 2005, copies: 4 },
    
    // Classic Literature
    { isbn: '9780141441146', title: 'Jane Eyre', author: 'Charlotte Brontë', category: 'Fiction', publisher: 'Smith, Elder & Co.', year: 1847, copies: 3 },
    { isbn: '9780060850524', title: 'Brave New World', author: 'Aldous Huxley', category: 'Fiction', publisher: 'Chatto & Windus', year: 1932, copies: 4 },
    { isbn: '9780143058144', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', category: 'Fiction', publisher: 'The Russian Messenger', year: 1866, copies: 3 },
    { isbn: '9780141439556', title: 'Wuthering Heights', author: 'Emily Brontë', category: 'Fiction', publisher: 'Thomas Cautley Newby', year: 1847, copies: 3 },
    
    // Thriller
    { isbn: '9780307474278', title: 'The Da Vinci Code', author: 'Dan Brown', category: 'Thriller', publisher: 'Doubleday', year: 2003, copies: 5 },
    { isbn: '9780439023528', title: 'The Hunger Games', author: 'Suzanne Collins', category: 'Fiction', publisher: 'Scholastic Press', year: 2008, copies: 6 },
    
    // Self-Help & Psychology
    { isbn: '9780735211292', title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', publisher: 'Avery', year: 2018, copies: 7 },
    { isbn: '9780812981605', title: 'The Power of Habit', author: 'Charles Duhigg', category: 'Psychology', publisher: 'Random House', year: 2012, copies: 5 },
    { isbn: '9780374533557', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', publisher: 'Farrar, Straus and Giroux', year: 2011, copies: 4 },
    { isbn: '9780345472328', title: 'Mindset', author: 'Carol S. Dweck', category: 'Psychology', publisher: 'Random House', year: 2006, copies: 4 },
    { isbn: '9780743269513', title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', category: 'Self-Help', publisher: 'Free Press', year: 1989, copies: 6 },
    
    // Finance & Business
    { isbn: '9781612680194', title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', category: 'Finance', publisher: 'Plata Publishing', year: 1997, copies: 6 },
    { isbn: '9780060555665', title: 'The Intelligent Investor', author: 'Benjamin Graham', category: 'Finance', publisher: 'Harper & Brothers', year: 1949, copies: 4 },
    { isbn: '9780804139298', title: 'Zero to One', author: 'Peter Thiel', category: 'Business', publisher: 'Crown Business', year: 2014, copies: 5 },
    { isbn: '9780307887894', title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', publisher: 'Crown Business', year: 2011, copies: 5 },
    { isbn: '9781455586691', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', category: 'Business', publisher: 'HarperBusiness', year: 2014, copies: 4 }
  ];

  console.log('📚 Adding books to VIT-AP University Central Library...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const book of books) {
    try {
      // Check if book already exists
      const existing = await db.get(
        'SELECT id FROM books WHERE isbn = ?',
        [book.isbn]
      );

      if (existing) {
        console.log(`⏭️  Skipped: ${book.title} (already exists)`);
        skippedCount++;
        continue;
      }

      // Insert book
      await db.run(
        `INSERT INTO books (isbn, title, author, category, publisher, publication_year, total_copies, available_copies)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book.isbn,
          book.title,
          book.author,
          book.category,
          book.publisher,
          book.year,
          book.copies,
          book.copies
        ]
      );

      console.log(`✅ Added: ${book.title} by ${book.author} (${book.copies} copies)`);
      addedCount++;
    } catch (error) {
      console.error(`❌ Error adding ${book.title}:`, error.message);
    }
  }

  await db.close();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Books added: ${addedCount}`);
  console.log(`⏭️  Books skipped: ${skippedCount}`);
  console.log(`📚 Total processed: ${books.length}`);
  console.log('='.repeat(60));
  console.log('\n🎉 Book import complete!\n');
}

addBooks().catch(console.error);
