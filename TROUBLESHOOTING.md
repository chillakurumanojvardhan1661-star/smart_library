# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. "UNIQUE constraint failed: users.email"

**Problem:** Trying to register with an email that already exists.

**Solution:**
- Use a different email address
- Or login with the existing account
- Demo account: admin@library.com / admin123

**To reset the database:**
```bash
cd backend
rm library.db
npm run dev
# Database will be recreated automatically
```

---

### 2. "UNIQUE constraint failed: books.isbn"

**Problem:** Trying to add a book with an ISBN that already exists.

**Solution:**
- Use a different ISBN
- Or update the existing book instead
- Check if the book already exists in the Books page

---

### 3. "UNIQUE constraint failed: members.email"

**Problem:** Trying to add a member with an email that already exists.

**Solution:**
- Use a different email address
- Check if the member already exists in the Members page

---

### 4. "Book not available"

**Problem:** Trying to issue a book that has no available copies.

**Solution:**
- Wait for the book to be returned
- Or add more copies of the book
- Check the Books page for availability

---

### 5. Port Already in Use

**Problem:** Port 5001 or 3000 is already in use.

**Backend (Port 5001):**
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=5002
```

**Frontend (Port 3000):**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in frontend/vite.config.js
server: { port: 3001 }
```

---

### 6. Database Connection Error

**Problem:** Cannot connect to database.

**Solution:**
```bash
cd backend

# Check if library.db exists
ls -la library.db

# If not, restart the server
npm run dev

# Database will be created automatically
```

---

### 7. Login Not Working

**Problem:** Cannot login with credentials.

**Possible Causes:**
1. Wrong email or password
2. User doesn't exist
3. Database not initialized

**Solutions:**

**Use demo account:**
- Email: admin@library.com
- Password: admin123

**Create new admin user:**
```bash
cd backend
node scripts/create-admin.js
```

**Reset database:**
```bash
cd backend
rm library.db
npm run dev
node scripts/create-admin.js
```

---

### 8. Charts Not Displaying

**Problem:** Analytics page shows empty charts.

**Solution:**
- Add some data first (books, members, issues)
- Refresh the page
- Check browser console for errors
- Ensure backend API is running

---

### 9. Toast Notifications Not Showing

**Problem:** No success/error messages appear.

**Solution:**
- Check if react-hot-toast is installed
- Refresh the page
- Check browser console for errors

**Reinstall if needed:**
```bash
cd frontend
npm install react-hot-toast
```

---

### 10. Modal Not Opening

**Problem:** Clicking "Add Book" or "Add Member" doesn't open modal.

**Solution:**
- Refresh the page
- Check browser console for errors
- Clear browser cache
- Try a different browser

---

### 11. API Errors (500 Internal Server Error)

**Problem:** API requests failing with 500 error.

**Solution:**
1. Check backend logs in terminal
2. Verify database is running
3. Check .env file configuration
4. Restart backend server

```bash
cd backend
npm run dev
```

---

### 12. Frontend Not Loading

**Problem:** Blank page or loading forever.

**Solution:**
1. Check if backend is running (port 5001)
2. Check browser console for errors
3. Clear browser cache
4. Restart frontend

```bash
cd frontend
npm run dev
```

---

### 13. Search Not Working

**Problem:** Search bar doesn't filter results.

**Solution:**
- Type at least 2 characters
- Wait a moment for debouncing
- Refresh the page
- Check if data exists

---

### 14. Export CSV Not Working

**Problem:** CSV download not starting.

**Solution:**
- Check if backend is running
- Check browser's download settings
- Try a different browser
- Check backend logs for errors

---

### 15. Fine Calculation Wrong

**Problem:** Fine amount doesn't match expected value.

**Current Formula:**
```
Fine = Overdue Days × $5 per day
```

**Example:**
- Due date: Feb 1
- Return date: Feb 6
- Overdue: 5 days
- Fine: 5 × $5 = $25

**To change fine rate:**
Edit `backend/src/controllers/issueController.js`:
```javascript
const FINE_PER_DAY = 5; // Change this value
```

---

## Quick Fixes

### Reset Everything
```bash
# Stop all servers
# Ctrl+C in both terminals

# Backend
cd backend
rm library.db
npm run dev

# In another terminal
cd backend
node scripts/create-admin.js

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Clear Browser Data
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh page (Ctrl+R or Cmd+R)

### Check System Status
```bash
# Check if backend is running
curl http://localhost:5001/health

# Check if frontend is running
curl http://localhost:3000

# Check database
cd backend
ls -la library.db
```

---

## Error Messages Explained

### "Access token required"
- You're not logged in
- Token expired (7 days)
- Solution: Login again

### "Invalid credentials"
- Wrong email or password
- Solution: Check credentials or register

### "Book not found"
- Book ID doesn't exist
- Solution: Check Books page for valid IDs

### "Member not found"
- Member ID doesn't exist
- Solution: Check Members page for valid IDs

### "Issue record not found"
- Issue ID doesn't exist or already returned
- Solution: Check Issues page

---

## Getting Help

### Check Logs

**Backend logs:**
- Look at terminal running `npm run dev` in backend folder
- Errors will show in red

**Frontend logs:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for errors in red

**Network logs:**
- Open browser DevTools (F12)
- Go to Network tab
- Check failed requests (red)
- Click on request to see details

### Debug Mode

**Enable verbose logging:**

Backend (`backend/src/server.js`):
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

Frontend (Browser Console):
```javascript
localStorage.debug = '*';
```

---

## Contact & Support

If issues persist:
1. Check all documentation files
2. Review error logs carefully
3. Try resetting the database
4. Ensure all dependencies are installed
5. Check Node.js version (18+)

---

**Last Updated:** February 11, 2026  
**Version:** 2.0.1
