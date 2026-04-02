# Quick Start Guide - Get Running in 5 Minutes

## Prerequisites
- Node.js 20+ installed
- Docker installed (for database)

## Step-by-Step Commands

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Start Database (Docker)
```bash
docker run -d \
  --name product-ledger-db \
  -e POSTGRES_USER=productledger \
  -e POSTGRES_PASSWORD=productledger123 \
  -e POSTGRES_DB=product_ledger_users \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Create Backend Environment File
```bash
cd server
cat > .env << 'EOF'
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
EOF
cd ..
```

### 4. Create Frontend Environment File
```bash
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
EOF
```

### 5. Start Backend (Terminal 1)
```bash
cd server
npm run dev
```

Wait for: `🚀 Server running on port 3001`

### 6. Start Frontend (Terminal 2)
```bash
npm run dev
```

Wait for: `Local: http://localhost:8080/`

### 7. Open Browser
Go to: http://localhost:8080

### 8. Login as Admin
- Email: `admin@productledger.com`
- Password: `admin123`

## Test Quick Flow

1. **Create Manufacturer Account:**
   - Sign Up → Email: `mfg@test.com`, Password: `test123456`, Role: Manufacturer
   - Sign in as Admin → Approve the manufacturer

2. **Create Product:**
   - Sign in as Manufacturer
   - Create MegaQR → Product: "Test Product", Batch: "BATCH-001"
   - Generate 5 ChildQRs

3. **Test as Retailer:**
   - Sign Up → Email: `retailer@test.com`, Role: Retailer
   - Admin approves
   - Sign in as Retailer → Lookup ChildQR → Commit message

4. **Test as Consumer:**
   - Sign Up → Email: `consumer@test.com`, Role: Consumer (auto-approved)
   - Sign in → Verify ChildQR → See complete history

## Verify It's Working

```bash
# Check backend health
curl http://localhost:3001/health

# Should return: {"status":"ok",...}
```

## Troubleshooting

**Backend won't start?**
- Check if port 3001 is free
- Verify database is running: `docker ps`
- Check `server/.env` file exists

**Frontend can't connect?**
- Verify backend is running
- Check `.env` has `VITE_API_URL=http://localhost:3001/api`
- Clear browser cache

**Database error?**
- Restart Docker container: `docker restart product-ledger-db`
- Check logs: `docker logs product-ledger-db`

## Next Steps

See `TESTING_GUIDE.md` for comprehensive role testing.

