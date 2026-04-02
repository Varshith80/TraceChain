#!/bin/bash

# Product Ledger Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Product Ledger Setup"
echo "========================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You can use Docker instead."
    echo "   Run: docker run -d --name product-ledger-db -e POSTGRES_USER=productledger -e POSTGRES_PASSWORD=productledger123 -e POSTGRES_DB=product_ledger_users -p 5432:5432 postgres:15-alpine"
else
    echo "✅ PostgreSQL detected"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create environment files
echo ""
echo "📝 Creating environment files..."

if [ ! -f .env ]; then
    cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
EOF
    echo "✅ Created .env"
else
    echo "⚠️  .env already exists, skipping..."
fi

if [ ! -f server/.env ]; then
    cat > server/.env << EOF
PORT=3001
NODE_ENV=development
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
EOF
    echo "✅ Created server/.env"
else
    echo "⚠️  server/.env already exists, skipping..."
fi

# Create logs directory
mkdir -p server/logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Start the backend: cd server && npm run dev"
echo "3. Start the frontend: npm run dev"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@productledger.com"
echo "  Password: admin123"
echo ""

