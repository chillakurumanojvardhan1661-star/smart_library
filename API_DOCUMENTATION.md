# 🔌 API Documentation

Base URL: `http://localhost:5001/api`

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Books](#books)
3. [Members](#members)
4. [Issues](#issues)
5. [Admin](#admin)
6. [Recommendations](#recommendations)
7. [Analytics](#analytics)
8. [Export](#export)

---

## 🔐 Authentication

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@library.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@library.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```

---

## 📚 Books

### Get All Books
```http
GET /books?search=java&category=Programming
```

**Query Parameters:**
- `search` (optional) - Search by title or author
- `category` (optional) - Filter by category

**Response:**
```json
[
  {
    "id": 1,
    "isbn": "9780134685991",
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "category": "Programming",
    "publisher": "Addison-Wesley",
    "publication_year": 2018,
    "total_copies": 5,
    "available_copies": 5,
    "created_at": "2026-02-11T11:57:26.000Z",
    "updated_at": "2026-02-11T11:57:26.000Z"
  }
]
```

### Get Book by ID
```http
GET /books/:id
```

### Create Book
```http
POST /books
```

**Request Body:**
```json
{
  "isbn": "9780134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "publisher": "Addison-Wesley",
  "publication_year": 2018,
  "total_copies": 5
}
```

### Update Book
```http
PUT /books/:id
```

### Delete Book
```http
DELETE /books/:id
```

---

## 👥 Members

### Get All Members
```http
GET /members
```

**Response:**
```json
[
  {
    "id": 1,
    "member_id": "MEM001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "555-0101",
    "address": "123 Main St, City",
    "membership_date": "2026-02-11",
    "status": "active",
    "created_at": "2026-02-11T11:57:26.000Z",
    "updated_at": "2026-02-11T11:57:26.000Z"
  }
]
```

### Get Member by ID
```http
GET /members/:id
```

### Get Member History
```http
GET /members/:id/history
```

**Response:**
```json
[
  {
    "id": 1,
    "book_id": 1,
    "member_id": 1,
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "issue_date": "2026-02-01",
    "due_date": "2026-02-15",
    "return_date": null,
    "fine_amount": 0,
    "status": "issued"
  }
]
```

### Create Member
```http
POST /members
```

**Request Body:**
```json
{
  "member_id": "MEM005",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-0105",
  "address": "456 Oak St"
}
```

### Update Member
```http
PUT /members/:id
```

---

## 📖 Issues

### Get All Issues
```http
GET /issues?status=issued
```

**Query Parameters:**
- `status` (optional) - Filter by status (issued/returned)

**Response:**
```json
[
  {
    "id": 1,
    "book_id": 1,
    "member_id": 1,
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "member_name": "John Doe",
    "member_id": "MEM001",
    "issue_date": "2026-02-01",
    "due_date": "2026-02-15",
    "return_date": null,
    "fine_amount": 0,
    "status": "issued"
  }
]
```

### Get Overdue Books
```http
GET /issues/overdue
```

### Issue Book
```http
POST /issues
```

**Request Body:**
```json
{
  "book_id": 1,
  "member_id": 1,
  "due_date": "2026-02-25"
}
```

### Return Book
```http
PUT /issues/:id/return
```

**Response:**
```json
{
  "id": 1,
  "book_id": 1,
  "member_id": 1,
  "issue_date": "2026-02-01",
  "due_date": "2026-02-15",
  "return_date": "2026-02-20",
  "fine_amount": 25,
  "status": "returned"
}
```

---

## 📊 Admin

### Get Dashboard Stats
```http
GET /admin/stats
```

**Response:**
```json
{
  "total_books": 5,
  "total_copies": 17,
  "available_copies": 17,
  "active_members": 4,
  "books_issued": 6,
  "overdue_books": 2,
  "total_fines_collected": 50
}
```

### Get Recent Activities
```http
GET /admin/activities
```

---

## 🤖 Recommendations

### Get Member Recommendations
```http
GET /recommendations/member/:memberId
```

**Response:**
```json
[
  {
    "id": 2,
    "isbn": "9780132350884",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "category": "Programming",
    "available_copies": 3,
    "relevance_score": 2
  }
]
```

### Get Trending Books
```http
GET /recommendations/trending
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "issue_count": 5
  }
]
```

---

## 📈 Analytics

### Get Issues Trend
```http
GET /analytics/issues-trend?days=30
```

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to analyze

**Response:**
```json
[
  {
    "date": "2026-02-01",
    "count": 3
  },
  {
    "date": "2026-02-02",
    "count": 5
  }
]
```

### Get Category Distribution
```http
GET /analytics/category-distribution
```

**Response:**
```json
[
  {
    "category": "Programming",
    "count": 2
  },
  {
    "category": "Software Engineering",
    "count": 2
  }
]
```

### Get Top Borrowers
```http
GET /analytics/top-borrowers
```

**Response:**
```json
[
  {
    "name": "John Doe",
    "member_id": "MEM001",
    "borrow_count": 10
  }
]
```

### Get Fine Analytics
```http
GET /analytics/fines
```

**Response:**
```json
{
  "total_fines": 10,
  "total_amount": 250,
  "avg_fine": 25,
  "max_fine": 50
}
```

---

## 📤 Export

### Export Books
```http
GET /export/books?format=csv
```

**Query Parameters:**
- `format` (optional, default: csv) - Export format (csv/json)

**Response:** CSV file download

### Export Members
```http
GET /export/members?format=csv
```

### Export Issues
```http
GET /export/issues?format=csv
```

---

## 🔒 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ❌ Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Notes

- All dates are in ISO 8601 format
- Fine calculation: $5 per day overdue
- JWT tokens expire after 7 days
- CSV exports use UTF-8 encoding
- Search is case-insensitive
- Pagination not implemented (future feature)

## 🧪 Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.com","password":"admin123"}'

# Get books (with token)
curl http://localhost:5001/api/books \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create book
curl -X POST http://localhost:5001/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"isbn":"1234567890","title":"Test Book","author":"Test Author"}'
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:5001/api`
3. Add Authorization header with Bearer token
4. Test each endpoint

---

**API Version:** 2.0  
**Last Updated:** February 11, 2026
