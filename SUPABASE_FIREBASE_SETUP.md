# Supabase & Firebase Integration Guide

## 🎯 Overview

This guide will help you integrate:
- **Supabase** - Cloud PostgreSQL database
- **Firebase** - Authentication service

---

## 📋 Prerequisites

1. Supabase account: https://supabase.com
2. Firebase account: https://firebase.google.com

---

## 🔥 Part 1: Firebase Setup (Authentication)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Enter project name: `vitap-library`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** authentication
4. Enable **Google** sign-in (optional)

### Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app name: `vitap-library-web`
5. Copy the `firebaseConfig` object

### Step 4: Add Firebase Config to Frontend

Create `frontend/.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=vitap-library.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vitap-library
VITE_FIREBASE_STORAGE_BUCKET=vitap-library.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 🗄️ Part 2: Supabase Setup (Database)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter details:
   - Name: `vitap-library`
   - Database Password: (create strong password)
   - Region: Choose closest to you
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (keep secret!)

### Step 3: Add Supabase Config to Backend

Update `backend/.env` file:

```env
USE_SQLITE=false
USE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the schema from `database/schema.sql`
4. Click "Run" to execute

Or use the migration script:

```bash
cd backend
node scripts/migrate-to-supabase.js
```

---

## 🔄 Part 3: Update Database Adapter

The project already has a database adapter that supports both SQLite and Supabase.

To switch to Supabase:

1. Update `backend/.env`:
   ```env
   USE_SQLITE=false
   USE_SUPABASE=true
   ```

2. Restart backend server:
   ```bash
   cd backend
   npm start
   ```

---

## 🔐 Part 4: Integrate Firebase Auth with Backend

### Option 1: Hybrid Approach (Recommended for Migration)

Keep existing JWT auth but add Firebase as an option:

```javascript
// Users can login with:
// 1. Email/Password (existing JWT)
// 2. Firebase Auth (new)
```

### Option 2: Full Firebase Auth

Replace JWT completely with Firebase tokens:

1. Frontend sends Firebase ID token
2. Backend verifies token with Firebase Admin SDK
3. Backend creates session

---

## 📊 Part 5: Migrate Existing Data

### Migrate from SQLite to Supabase:

```bash
cd backend
node scripts/export-sqlite-data.js
node scripts/import-to-supabase.js
```

This will:
1. Export all data from SQLite
2. Import to Supabase tables
3. Preserve relationships

---

## 🧪 Testing

### Test Firebase Auth:

1. Start frontend: `cd frontend && npm run dev`
2. Go to http://localhost:3001
3. Try registering with email/password
4. Check Firebase Console → Authentication → Users

### Test Supabase Database:

1. Start backend: `cd backend && npm start`
2. Make API call: `curl http://localhost:5001/api/books`
3. Check Supabase Dashboard → Table Editor

---

## 🚀 Deployment

### Deploy Backend (with Supabase):

```bash
# Vercel, Railway, or Render
# Set environment variables:
USE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-key
```

### Deploy Frontend (with Firebase):

```bash
# Vercel or Netlify
# Set environment variables:
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
# ... other Firebase config
```

---

## 🔒 Security Best Practices

### Supabase:
1. ✅ Enable Row Level Security (RLS)
2. ✅ Use service_role key only in backend
3. ✅ Never expose service_role key in frontend
4. ✅ Set up proper database policies

### Firebase:
1. ✅ Enable App Check
2. ✅ Set up security rules
3. ✅ Use environment variables
4. ✅ Enable email verification

---

## 📝 Environment Variables Summary

### Backend (.env):
```env
PORT=5001
JWT_SECRET=your-secret
USE_SQLITE=false
USE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Frontend (.env):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎓 Benefits for Your Project

### Supabase:
- ✅ Cloud-hosted PostgreSQL
- ✅ Real-time subscriptions
- ✅ Auto-generated REST API
- ✅ Built-in authentication
- ✅ File storage
- ✅ Free tier: 500MB database

### Firebase:
- ✅ Easy authentication
- ✅ Google/Social login
- ✅ Email verification
- ✅ Password reset
- ✅ Multi-factor auth
- ✅ Free tier: 10K users

---

## 🆘 Troubleshooting

### Firebase Auth Not Working:
1. Check API keys in `.env`
2. Verify domain in Firebase Console
3. Check browser console for errors

### Supabase Connection Failed:
1. Verify project URL and keys
2. Check if project is paused (free tier)
3. Test connection in Supabase Dashboard

### CORS Issues:
1. Add your domain to Supabase allowed origins
2. Update Firebase authorized domains

---

## 📚 Next Steps

1. ✅ Set up Firebase project
2. ✅ Set up Supabase project
3. ✅ Update environment variables
4. ✅ Test authentication
5. ✅ Migrate data
6. ✅ Deploy to production

Need help? Check the official docs:
- Supabase: https://supabase.com/docs
- Firebase: https://firebase.google.com/docs
