import dotenv from 'dotenv';
import path from 'path';

// Inject Postgres URL for local execution
process.env.POSTGRES_URL = "postgres://d8f6a2fe275c54d6dfd09ace0ec53e3cfc862d035c81f041ac86d0a26cff0c8d:sk_Vf52F4hogUjASTP_yZ4t-@db.prisma.io:5432/postgres?sslmode=require";

// Load production environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const sampleBooks = [
    { isbn: "978-0131103627", title: "The C Programming Language", author: "Brian W. Kernighan, Dennis M. Ritchie", category: "Computer Science", publisher: "Prentice Hall", publication_year: 1988, total_copies: 5, price: 45.99 },
    { isbn: "978-0201896831", title: "The Art of Computer Programming, Vol. 1", author: "Donald E. Knuth", category: "Computer Science", publisher: "Addison-Wesley", publication_year: 1997, total_copies: 3, price: 65.00 },
    { isbn: "978-0321751041", title: "Design Patterns: Elements of Reusable Object-Oriented Software", author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", category: "Software Engineering", publisher: "Addison-Wesley Professional", publication_year: 1994, total_copies: 4, price: 54.99 },
    { isbn: "978-0132350884", title: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", category: "Software Engineering", publisher: "Prentice Hall", publication_year: 2008, total_copies: 6, price: 42.50 },
    { isbn: "978-0134685991", title: "Effective Java", author: "Joshua Bloch", category: "Programming", publisher: "Addison-Wesley", publication_year: 2017, total_copies: 5, price: 49.99 },
    { isbn: "978-1449331818", title: "Learning Python", author: "Mark Lutz", category: "Programming", publisher: "O'Reilly Media", publication_year: 2013, total_copies: 8, price: 60.00 },
    { isbn: "978-0262033848", title: "Introduction to Algorithms", author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein", category: "Algorithms", publisher: "The MIT Press", publication_year: 2009, total_copies: 4, price: 85.00 },
    { isbn: "978-0135957059", title: "The Pragmatic Programmer", author: "David Thomas, Andrew Hunt", category: "Software Engineering", publisher: "Addison-Wesley", publication_year: 2019, total_copies: 7, price: 39.99 },
    { isbn: "978-1491950296", title: "Programming Rust", author: "Jim Blandy, Jason Orendorff", category: "Programming", publisher: "O'Reilly Media", publication_year: 2017, total_copies: 3, price: 59.99 },
    { isbn: "978-1593279288", title: "Python Crash Course", author: "Eric Matthes", category: "Programming", publisher: "No Starch Press", publication_year: 2019, total_copies: 10, price: 39.95 },
    { isbn: "978-0321890683", title: "The C++ Programming Language", author: "Bjarne Stroustrup", category: "Programming", publisher: "Addison-Wesley", publication_year: 2013, total_copies: 2, price: 74.99 },
    { isbn: "978-1449373320", title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", category: "Data Engineering", publisher: "O'Reilly Media", publication_year: 2017, total_copies: 5, price: 45.00 },
    { isbn: "978-1491901427", title: "Fluent Python", author: "Luciano Ramalho", category: "Programming", publisher: "O'Reilly Media", publication_year: 2015, total_copies: 4, price: 55.00 },
    { isbn: "978-0134494166", title: "Clean Architecture", author: "Robert C. Martin", category: "Software Architecture", publisher: "Prentice Hall", publication_year: 2017, total_copies: 6, price: 35.00 },
    { isbn: "978-0131873254", title: "Compilers: Principles, Techniques, and Tools", author: "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman", category: "Computer Science", publisher: "Pearson", publication_year: 2006, total_copies: 2, price: 120.00 },
    { isbn: "978-0201633610", title: "Design Patterns (Gang of Four)", author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", category: "Software Engineering", publisher: "Addison-Wesley", publication_year: 1994, total_copies: 3, price: 54.99 },
    { isbn: "978-1491924082", title: "Site Reliability Engineering", author: "Niall Richard Murphy, Betsy Beyer, Chris Jones, Jennifer Petoff", category: "DevOps", publisher: "O'Reilly Media", publication_year: 2016, total_copies: 4, price: 49.99 },
    { isbn: "978-0134092669", title: "Refactoring: Improving the Design of Existing Code", author: "Martin Fowler", category: "Software Engineering", publisher: "Addison-Wesley", publication_year: 2018, total_copies: 5, price: 59.99 },
    { isbn: "978-0137081073", title: "The Mythical Man-Month", author: "Frederick P. Brooks Jr.", category: "Software Engineering", publisher: "Addison-Wesley", publication_year: 1995, total_copies: 3, price: 34.99 },
    { isbn: "978-1119056553", title: "Operating System Concepts", author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne", category: "Computer Science", publisher: "Wiley", publication_year: 2018, total_copies: 4, price: 154.99 }
];

async function seedBooks() {
    const { default: pool } = await import('../src/config/db-adapter.js');
    console.log('Seeding 20 sample books into the database...');
    let added = 0;

    for (const book of sampleBooks) {
        try {
            await pool.query(
                `INSERT INTO books (isbn, title, author, category, publisher, publication_year, total_copies, available_copies, price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (isbn) DO NOTHING`,
                [book.isbn, book.title, book.author, book.category, book.publisher, book.publication_year, book.total_copies, book.total_copies, book.price]
            );
            added++;
            console.log(`Added: ${book.title}`);
        } catch (e) {
            console.error(`Error adding book ${book.title}:`, e.message);
        }
    }
    console.log(`✅ Completed! Added ${added} books to the library.`);

    // Explicitly exit process
    process.exit(0);
}

seedBooks();
