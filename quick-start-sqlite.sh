#!/bin/bash

echo "🚀 Quick Start with SQLite (No PostgreSQL needed)"
echo ""

# Install SQLite dependencies
echo "📦 Installing SQLite dependencies..."
cd backend
npm install sqlite3 sqlite --save

# Create .env
cat > .env << EOF
PORT=5000
USE_SQLITE=true
JWT_SECRET=$(openssl rand -base64 32)
EOF

echo "✅ Backend configured with SQLite"
echo ""
echo "🎉 Ready to start!"
echo ""
echo "Run these commands in separate terminals:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
