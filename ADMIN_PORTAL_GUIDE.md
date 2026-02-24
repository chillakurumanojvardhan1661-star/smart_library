# 👨‍💼 Admin Portal Guide

## 🔐 Admin Credentials

**Email:** `admin@library.com`  
**Password:** `admin123`

---

## 📋 Admin Portal Features

### 1. **Dashboard** (/)
- View system statistics
- Total books, members, issues
- Overdue books and fines collected
- Export data to CSV

### 2. **User Management** (/users) ⭐ NEW
- **View all registered users** (students, faculty, staff)
- **Approve/Reject pending registrations**
- **Change user roles** (student → faculty, etc.)
- **Suspend/Activate accounts**
- **Delete users** (except admins)
- **View user fine balances**
- **Filter by status** (all, pending, active, suspended, rejected)

**Key Actions:**
- ✅ **Approve** - Activate pending user accounts
- ❌ **Reject** - Reject registration requests
- 🔄 **Change Role** - Modify user permissions
- ⏸️ **Suspend** - Temporarily disable accounts
- 🗑️ **Delete** - Remove users permanently

### 3. **Book Management** (/books)
- Add new books
- Edit book details
- Delete books
- View availability

### 4. **Member Management** (/members)
- Add library members
- Edit member information
- View borrowing history

### 5. **Issue & Return** (/issues)
- Issue books to users
- Process returns
- Automatic fine calculation
- View all transactions

### 6. **Fine Management** (/fines)
- View all fines
- Record payments
- Waive fines
- Create manual fines
- View statistics

### 7. **Analytics** (/analytics)
- Issues trend
- Category distribution
- Top borrowers
- Fine analytics

### 8. **Recommendations** (/recommendations)
- AI-based book suggestions
- Trending books

---

## 🆕 User Registration Workflow

### When a new user registers:

1. **User fills registration form** at `/register`
   - Provides username, email, password
   - Selects role (student/faculty/staff)
   - Enters department, ID numbers

2. **Account status = "pending"**
   - User cannot login yet
   - Awaiting admin approval

3. **Admin reviews in User Management** (`/users`)
   - Click "Pending" filter to see new registrations
   - Review user details
   - Click "✓ Approve" to activate
   - Or click "✗ Reject" to deny

4. **User can now login**
   - Status changed to "active"
   - Full access based on their role

---

## 🎯 Common Admin Tasks

### Approve New User
1. Login as admin
2. Go to **Users** page
3. Click **Pending** filter
4. Review user details
5. Click **✓ Approve**

### Change User Role
1. Go to **Users** page
2. Find the user
3. Click **Role** button
4. Select new role
5. Confirm

### Suspend Problematic User
1. Go to **Users** page
2. Find the user
3. Click **Suspend**
4. User cannot login until reactivated

### View User Fine Balance
1. Go to **Users** page
2. Check "Fine Balance" column
3. Click user to see details
4. Go to **Fines** page to manage

---

## 📊 User Status Types

| Status | Description | Can Login? |
|--------|-------------|------------|
| **Pending** | Awaiting approval | ❌ No |
| **Active** | Approved and active | ✅ Yes |
| **Suspended** | Temporarily disabled | ❌ No |
| **Rejected** | Registration denied | ❌ No |

---

## 🔒 Security Features

- ✅ Only admins can access User Management
- ✅ Cannot delete admin users
- ✅ All actions are logged
- ✅ Status changes tracked with timestamps
- ✅ Approval tracked by admin ID

---

## 💡 Tips

1. **Check pending users regularly** - Look for the yellow badge showing pending count
2. **Review user details before approving** - Check department, ID numbers
3. **Use filters** - Quickly find users by status
4. **Monitor fine balances** - Suspend users with excessive fines
5. **Change roles carefully** - Role determines borrowing limits and fines

---

## 🚀 Quick Access

- **Login:** http://localhost:3000/login
- **User Management:** http://localhost:3000/users
- **Dashboard:** http://localhost:3000/

---

## 📞 Support

For issues or questions, check:
- `TROUBLESHOOTING.md`
- `RBAC_IMPLEMENTATION.md`
- `FINE_MANAGEMENT.md`

---

**Last Updated:** February 2026  
**Version:** 3.1 (User Management Added)
