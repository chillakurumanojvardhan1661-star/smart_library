#!/bin/bash

echo "🚀 Library Management System - Quick Setup"
echo ""

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
    USE_POSTGRES=true
else
    echo "⚠️  PostgreSQL not found"
    echo "📦 Installing PostgreSQL via Homebrew..."
    read -p "Install PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install postgresql@15
        brew services start postgresql@15
        USE_POSTGRES=true
    else
        echo "📝 Using SQLite instead (simpler, no installation needed)"
        USE_POSTGRES=false
    fi
fi

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend

if [ "$USE_POSTGRES" = true ]; then
    echo "Using PostgreSQL"
    # Create database
    createdb library_db 2>/dev/null || echo "Database already exists"
    
    # Run schema
    psql library_db < ../database/schema.sql
    
    # Update .env
    cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=$USER
DB_PASSWORD=
JWT_SECRET=$(openssl rand -base64 32)
EOF
else
    echo "Using SQLite"
    npm install sqlite3 sqlite --save
    
    # Update .env for SQLite
    cat > .env << EOF
PORT=5000
USE_SQLITE=true
JWT_SECRET=$(openssl rand -base64 32)
EOF
fi

echo "✅ Backend configured"

# Start servers
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
