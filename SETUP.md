# Library Management System - Setup Guide

## Prerequisites Installation

### Install PostgreSQL (Recommended)

Using Homebrew:
```bash
brew install postgresql@15
brew services start postgresql@15
```

Or download from: https://www.postgresql.org/download/macosx/

### Alternative: Use Docker
```bash
docker run --name library-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

## Database Setup

1. Create the database:
```bash
createdb library_db
```

2. Run the schema:
```bash
psql -U postgres -d library_db -f database/schema.sql
```

Or if using default user:
```bash
psql library_db < database/schema.sql
```

## Backend Configuration

1. Update `backend/.env` with your database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_change_this_in_production
```

2. Start the backend:
```bash
cd backend
npm run dev
```

Backend will run on http://localhost:5000

## Frontend Setup

Start the frontend:
```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

## Testing the API

Health check:
```bash
curl http://localhost:5000/health
```

## Quick Start with Sample Data

After database setup, you can add sample data:

```sql
-- Add sample books
INSERT INTO books (isbn, title, author, category, publisher, publication_year, total_copies, available_copies)
VALUES 
  ('9780134685991', 'Effective Java', 'Joshua Bloch', 'Programming', 'Addison-Wesley', 2018, 5, 5),
  ('9780132350884', 'Clean Code', 'Robert Martin', 'Programming', 'Prentice Hall', 2008, 3, 3),
  ('9780201633610', 'Design Patterns', 'Gang of Four', 'Software Engineering', 'Addison-Wesley', 1994, 4, 4);

-- Add sample members
INSERT INTO members (member_id, name, email, phone, address)
VALUES 
  ('MEM001', 'John Doe', 'john@example.com', '555-0101', '123 Main St'),
  ('MEM002', 'Jane Smith', 'jane@example.com', '555-0102', '456 Oak Ave');

-- Add sample admin (password: admin123)
INSERT INTO admins (username, password_hash, email)
VALUES ('admin', '$2a$10$rKvVLZ8L8qKqKqKqKqKqKuXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'admin@library.com');
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `brew services list`
- Check credentials in `.env` file
- Ensure database exists: `psql -l`

### Port Already in Use
- Backend: Change PORT in `.env`
- Frontend: Change port in `vite.config.js`

## Next Steps

1. Install PostgreSQL
2. Create database and run schema
3. Configure `.env` file
4. Start backend server
5. Start frontend server
6. Access at http://localhost:3000
