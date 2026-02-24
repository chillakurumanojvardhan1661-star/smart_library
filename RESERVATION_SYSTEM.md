# Book Reservation System

## Overview
The VIT-AP University Central Library now implements a reservation-based book borrowing system where Students, Faculty, and Staff must reserve books and wait for admin approval before they can borrow them.

## User Roles & Permissions

### Admin
- Can add/edit/delete books
- Can view all reservations
- Can approve or reject reservations
- Can directly issue books to members
- Full access to all system features

### Student, Faculty, Staff
- Can view all books
- Can reserve available books
- Can view their own reservations
- Can cancel pending reservations
- Cannot add books or directly issue books
- Must wait for admin approval to borrow books

## Reservation Workflow

### For Students/Faculty/Staff:

1. **Browse Books**
   - Navigate to Books page
   - Search and filter available books
   - View availability status

2. **Reserve a Book**
   - Click "Reserve" button on desired book
   - Reservation is created with "pending" status
   - User receives confirmation message

3. **Track Reservations**
   - Navigate to "My Reservations" page
   - View all reservations with status:
     - **Pending**: Waiting for admin approval
     - **Approved**: Book has been issued
     - **Rejected**: Request was denied
     - **Cancelled**: User cancelled the request

4. **Cancel Reservation**
   - Can cancel only "pending" reservations
   - Click "Cancel" button on reservation

### For Admin:

1. **View All Reservations**
   - Navigate to "Reservations" page
   - See all user reservations with details:
     - Book information
     - User information and role
     - Reservation date
     - Current status
     - Book availability

2. **Approve Reservation**
   - Click "Approve" button on pending reservation
   - System automatically:
     - Creates an issue record
     - Decreases available book copies
     - Sets due date based on user role
     - Updates reservation status to "approved"

3. **Reject Reservation**
   - Click "Reject" button on pending reservation
   - Reservation status changes to "rejected"
   - Book remains available for others

## Database Schema

### Reservations Table
```sql
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER,
  user_id INTEGER,
  reservation_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending',
  notified BOOLEAN DEFAULT 0,
  expires_at DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Reservation Status Values
- `pending`: Waiting for admin approval
- `approved`: Admin approved and book issued
- `rejected`: Admin rejected the request
- `cancelled`: User cancelled the request

## API Endpoints

### User Endpoints
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/my-reservations` - Get user's reservations
- `PATCH /api/reservations/:id/cancel` - Cancel a pending reservation

### Admin Endpoints
- `GET /api/reservations` - Get all reservations (with optional status filter)
- `PATCH /api/reservations/:id/approve` - Approve reservation and issue book
- `PATCH /api/reservations/:id/reject` - Reject a reservation

## Features

### Validation & Business Rules
1. Users cannot reserve the same book multiple times (if already pending)
2. Admin can only approve if book copies are available
3. Only pending reservations can be approved/rejected/cancelled
4. Approved reservations automatically create issue records
5. Due dates are calculated based on user role:
   - Student: 14 days
   - Faculty: 30 days
   - Staff: 21 days

### User Experience
- Real-time availability display
- Status badges with color coding
- Confirmation dialogs for actions
- Toast notifications for success/error
- Disabled buttons when action not allowed

## Benefits

1. **Controlled Access**: Admin has full control over who borrows books
2. **Fair Distribution**: Prevents unauthorized book issues
3. **Accountability**: Complete audit trail of all reservations
4. **Transparency**: Users can track their reservation status
5. **Flexibility**: Admin can reject requests if needed
6. **Role-Based**: Different borrowing limits and periods per role

## Testing the System

### As Student/Faculty/Staff:
1. Login with demo credentials
2. Go to Books page
3. Click "Reserve" on any available book
4. Go to "My Reservations" to see status
5. Try to cancel a pending reservation

### As Admin:
1. Login as admin (admin@library.com / admin123)
2. Go to "Reservations" page
3. See all pending reservations
4. Approve or reject reservations
5. Verify book is issued after approval

## Future Enhancements

1. **Email Notifications**: Notify users when reservation is approved/rejected
2. **Reservation Queue**: Automatic approval when book becomes available
3. **Expiration**: Auto-cancel reservations after X days
4. **Priority System**: Faculty gets priority over students
5. **Reservation Limits**: Limit number of pending reservations per user
6. **Waitlist**: Queue system for popular books

## Related Documentation
- [RBAC Implementation](RBAC_IMPLEMENTATION.md)
- [Fine Management](FINE_MANAGEMENT.md)
- [Admin Portal Guide](ADMIN_PORTAL_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
