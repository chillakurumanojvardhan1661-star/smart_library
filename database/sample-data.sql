-- Sample Books
INSERT INTO books (isbn, title, author, category, publisher, publication_year, total_copies, available_copies)
VALUES 
  ('9780134685991', 'Effective Java', 'Joshua Bloch', 'Programming', 'Addison-Wesley', 2018, 5, 5),
  ('9780132350884', 'Clean Code', 'Robert C. Martin', 'Programming', 'Prentice Hall', 2008, 3, 3),
  ('9780201633610', 'Design Patterns', 'Gang of Four', 'Software Engineering', 'Addison-Wesley', 1994, 4, 4),
  ('9780596007126', 'Head First Design Patterns', 'Eric Freeman', 'Software Engineering', 'O''Reilly', 2004, 2, 2),
  ('9780137081073', 'The Clean Coder', 'Robert C. Martin', 'Professional Development', 'Prentice Hall', 2011, 3, 3);

-- Sample Members
INSERT INTO members (member_id, name, email, phone, address)
VALUES 
  ('MEM001', 'John Doe', 'john.doe@example.com', '555-0101', '123 Main St, City'),
  ('MEM002', 'Jane Smith', 'jane.smith@example.com', '555-0102', '456 Oak Ave, Town'),
  ('MEM003', 'Bob Johnson', 'bob.j@example.com', '555-0103', '789 Pine Rd, Village'),
  ('MEM004', 'Alice Williams', 'alice.w@example.com', '555-0104', '321 Elm St, City');

-- Sample Issues (some active, some returned)
INSERT INTO issues (book_id, member_id, issue_date, due_date, return_date, fine_amount, status)
VALUES 
  (1, 1, date('now', '-10 days'), date('now', '+4 days'), NULL, 0, 'issued'),
  (2, 2, date('now', '-5 days'), date('now', '+9 days'), NULL, 0, 'issued'),
  (3, 3, date('now', '-20 days'), date('now', '-6 days'), date('now', '-1 days'), 25, 'returned'),
  (4, 4, date('now', '-15 days'), date('now', '-1 days'), NULL, 0, 'issued');
