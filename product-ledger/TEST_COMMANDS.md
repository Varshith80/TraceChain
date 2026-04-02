# 🧪 Complete Testing Commands Guide

This document provides all commands needed to test the entire Product Ledger website.

---

## 📋 Prerequisites Check

### Check Node.js Version
```powershell
node -v
# Should be v20 or higher
```

### Check Docker (for database)
```powershell
docker --version
```

### Check if ports are available
```powershell
# Check port 3001 (backend)
netstat -an | findstr 3001

# Check port 8080 (frontend)
netstat -an | findstr 8080

# Check port 5432 (database)
netstat -an | findstr 5432
```

---

## 🚀 Step 1: Install Dependencies

### Install Frontend Dependencies
```powershell
npm install
```

### Install Backend Dependencies
```powershell
cd server
npm install
cd ..
```

---

## 🗄️ Step 2: Set Up Database

### Option A: Using Docker (Recommended)
```powershell
# Start PostgreSQL container
docker run -d `
  --name product-ledger-db `
  -e POSTGRES_USER=productledger `
  -e POSTGRES_PASSWORD=productledger123 `
  -e POSTGRES_DB=product_ledger_users `
  -e POSTGRES_HOST_AUTH_METHOD=md5 `
  -p 5432:5432 `
  postgres:15-alpine

# Verify container is running
docker ps

# Check database logs (if needed)
docker logs product-ledger-db
```

### Option B: Using Docker Compose
```powershell
docker-compose up -d postgres
```

### Verify Database Connection
```powershell
# Test connection
docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT version();"
```

---

## ⚙️ Step 3: Configure Environment Variables

### Create Backend Environment File
```powershell
cd server

# Create .env file
@"
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users
FABRIC_USE_MOCK=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
"@ | Out-File -FilePath .env -Encoding utf8

cd ..
```

### Create Frontend Environment File
```powershell
# Create .env file in root directory
@"
VITE_API_URL=http://localhost:3001/api
"@ | Out-File -FilePath .env -Encoding utf8
```

**Note:** If you're using Supabase instead of the backend API, you can also add:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

---

## 🏃 Step 4: Start All Services

### Terminal 1: Start Backend Server
```powershell
cd server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3001
Environment: development
Health check: http://localhost:3001/health
Database connection established
Database schema initialized
Fabric connection initialized successfully
```

### Terminal 2: Start Frontend
```powershell
# In root directory
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

---

## ✅ Step 5: Verify Services Are Running

### Test Backend Health Endpoint
```powershell
# Using PowerShell
Invoke-WebRequest -Uri http://localhost:3001/health | Select-Object -ExpandProperty Content

# Or using curl (if available)
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-XX...",
  "service": "product-ledger-backend"
}
```

### Test Frontend
Open browser: **http://localhost:8080**

You should see the landing page.

---

## 🧪 Step 6: Run Complete Test Suite

### 6.1 Test Database Connection
```powershell
# Test from backend
cd server
node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: 'postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users', connectionTimeoutMillis: 5000 }); p.query('SELECT 1').then(() => { console.log('✅ Database connection: SUCCESS'); p.end(); process.exit(0); }).catch(e => { console.log('❌ Database connection: FAILED', e.message); p.end(); process.exit(1); });"
cd ..
```

### 6.2 Test Backend API Endpoints
```powershell
# Health check
Invoke-WebRequest -Uri http://localhost:3001/health

# Test auth endpoint (should return 401 without token)
Invoke-WebRequest -Uri http://localhost:3001/api/auth/me -Method GET
```

### 6.3 Test Frontend Build
```powershell
# Build frontend to check for errors
npm run build

# Preview production build
npm run preview
```

---

## 👤 Step 7: Manual Testing - All User Roles

### 7.1 Test Admin Role

#### Login as Admin
1. Open browser: http://localhost:8080
2. Navigate to `/auth` or click "Sign In"
3. Use credentials:
   - **Email:** `admin@productledger.com`
   - **Password:** `admin123`
4. Click "Sign In"

**Expected:** Redirected to Admin Dashboard (`/admin`)

#### Test Admin Features
```powershell
# Verify admin can access admin routes
# In browser console (F12):
# Check localStorage for auth token
localStorage.getItem('auth_token')
```

**Test Checklist:**
- [ ] View all users in "All Users" section
- [ ] See admin user listed
- [ ] Filter users by role/status
- [ ] View user details
- [ ] Create new admin user
- [ ] Approve pending users
- [ ] Reject users

### 7.2 Test Manufacturer Role

#### Create Manufacturer Account
1. Sign out from admin
2. Go to Sign Up page (`/auth`)
3. Fill form:
   - Email: `manufacturer@test.com`
   - Password: `test123456`
   - Full Name: `Test Manufacturer`
   - Company Name: `Test Manufacturing Co.`
   - GST Number: `GST123456`
   - Role: **Manufacturer**
4. Click "Sign Up"

**Expected:** Redirected to Pending Approval page

#### Approve Manufacturer (as Admin)
1. Sign in as admin
2. Go to Admin Dashboard
3. Find manufacturer user
4. Click "Approve"

#### Test Manufacturer Features
1. Sign in as manufacturer: `manufacturer@test.com` / `test123456`
2. You should see Manufacturer Dashboard

**Test Checklist:**
- [ ] Create MegaQR
  - Product: `Test Product`
  - Batch No: `BATCH-001`
  - Mfg Date: Today
  - Expiry Date: Future date
  - Lot Size: `10`
- [ ] View created MegaQR in list
- [ ] Generate ChildQRs (5 children)
- [ ] View QR codes
- [ ] Commit message to MegaQR: `Quality Checked`
- [ ] View committed messages
- [ ] View MegaQR details

### 7.3 Test Retailer Role

#### Create Retailer Account
1. Sign out
2. Sign up as Retailer:
   - Email: `retailer@test.com`
   - Password: `test123456`
   - Full Name: `Test Retailer`
   - Company Name: `Test Retail Store`
   - Role: **Retailer**
3. Sign up

#### Approve Retailer (as Admin)
1. Sign in as admin
2. Approve retailer account

#### Test Retailer Features
1. Sign in as retailer: `retailer@test.com` / `test123456`
2. You should see Retailer Dashboard

**Test Checklist:**
- [ ] Lookup product using ChildQR ID (from manufacturer)
- [ ] View product details
- [ ] See manufacturer committed messages
- [ ] Commit message as retailer: `Received at Retailer`
- [ ] View commit history
- [ ] Scan QR code (if camera available)

### 7.4 Test Consumer Role

#### Create Consumer Account
1. Sign out
2. Sign up as Consumer:
   - Email: `consumer@test.com`
   - Password: `test123456`
   - Full Name: `Test Consumer`
   - Role: **Consumer**
3. Sign up

**Note:** Consumers are auto-approved!

#### Test Consumer Features
1. Sign in as consumer: `consumer@test.com` / `test123456`
2. You should see Consumer Dashboard

**Test Checklist:**
- [ ] Verify product using ChildQR ID
- [ ] See verification result (Valid/Invalid)
- [ ] View complete product history
- [ ] See all manufacturer messages
- [ ] See all retailer messages
- [ ] View product timeline
- [ ] Report counterfeit (optional)

---

## 🔄 Step 8: End-to-End Test Flow

### Complete Product Journey Test

#### As Manufacturer:
```powershell
# 1. Create MegaQR
# Product: "Premium Coffee Beans"
# Batch: "BATCH-2025-001"
# Generate 5 ChildQRs

# 2. Commit messages:
# - "Packed"
# - "Quality Checked"
# - "Shipped"
```

#### As Retailer:
```powershell
# 1. Lookup ChildQR (use ID from manufacturer)
# 2. Verify you see all manufacturer messages
# 3. Commit messages:
# - "Received at Retailer"
# - "Stocked"
```

#### As Consumer:
```powershell
# 1. Verify the same ChildQR
# 2. Verify you see:
#    ✅ Product is authentic
#    ✅ All manufacturer messages
#    ✅ All retailer messages
#    ✅ Complete timeline
```

---

## 🐛 Troubleshooting Commands

### Backend Issues

#### Check if backend is running
```powershell
netstat -an | findstr 3001
```

#### Check backend logs
```powershell
# If running in terminal, check the output
# Or check log files
cd server
Get-Content logs\combined.log -Tail 50
```

#### Restart backend
```powershell
# Stop: Ctrl+C in terminal
# Start again:
cd server
npm run dev
```

#### Check database connection from backend
```powershell
cd server
node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users' }); p.query('SELECT NOW()').then(r => { console.log('✅ Connected:', r.rows[0]); p.end(); }).catch(e => { console.log('❌ Error:', e.message); p.end(); });"
```

### Frontend Issues

#### Check if frontend is running
```powershell
netstat -an | findstr 8080
```

#### Clear browser cache
```powershell
# In browser (F12 → Console):
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### Check environment variables
```powershell
# Verify .env file exists
Test-Path .env
Get-Content .env

# Verify VITE_API_URL is set
```

#### Rebuild frontend
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Rebuild
npm run build
```

### Database Issues

#### Check if database container is running
```powershell
docker ps | findstr product-ledger-db
```

#### Restart database container
```powershell
docker restart product-ledger-db
```

#### Check database logs
```powershell
docker logs product-ledger-db
```

#### Recreate database container
```powershell
# Stop and remove
docker stop product-ledger-db
docker rm product-ledger-db

# Run FINAL_FIX.ps1 script
.\FINAL_FIX.ps1

# Or manually recreate
docker run -d `
  --name product-ledger-db `
  -e POSTGRES_USER=productledger `
  -e POSTGRES_PASSWORD=productledger123 `
  -e POSTGRES_DB=product_ledger_users `
  -e POSTGRES_HOST_AUTH_METHOD=md5 `
  -p 5432:5432 `
  postgres:15-alpine
```

#### Test database connection
```powershell
docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT version();"
```

### Port Conflicts

#### Find process using port
```powershell
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## 📊 Quick Test Script

### PowerShell Test Script
```powershell
# Save as test-all.ps1

Write-Host "🧪 Testing Product Ledger..." -ForegroundColor Cyan

# Test 1: Database
Write-Host "`n1. Testing Database..." -ForegroundColor Yellow
$dbTest = docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database: OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Database: FAILED" -ForegroundColor Red
}

# Test 2: Backend Health
Write-Host "`n2. Testing Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3001/health -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend: FAILED (not running or error)" -ForegroundColor Red
}

# Test 3: Frontend
Write-Host "`n3. Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:8080 -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend: FAILED (not running or error)" -ForegroundColor Red
}

Write-Host "`n✅ Testing Complete!" -ForegroundColor Cyan
```

Run the script:
```powershell
.\test-all.ps1
```

---

## 🎯 Quick Command Reference

### Start Everything
```powershell
# Terminal 1: Database
docker start product-ledger-db

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: Frontend
npm run dev
```

### Stop Everything
```powershell
# Stop frontend: Ctrl+C
# Stop backend: Ctrl+C
# Stop database
docker stop product-ledger-db
```

### Reset Everything
```powershell
# Stop all
docker stop product-ledger-db
docker rm product-ledger-db

# Remove database data (careful!)
docker volume rm product-ledger_postgres_data

# Recreate database
.\FINAL_FIX.ps1

# Restart services
cd server
npm run dev
# (In another terminal)
npm run dev
```

---

## ✅ Success Checklist

Before considering testing complete, verify:

- [ ] Database container is running
- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:8080
- [ ] Health check endpoint returns OK
- [ ] Can sign up as new user
- [ ] Admin can login with default credentials
- [ ] Admin can view and manage users
- [ ] Admin can approve/reject users
- [ ] Manufacturer can create MegaQR
- [ ] Manufacturer can generate ChildQRs
- [ ] Manufacturer can commit messages
- [ ] Retailer can lookup products
- [ ] Retailer can commit messages
- [ ] Consumer can verify products
- [ ] Consumer sees complete product history
- [ ] All roles can access their respective dashboards
- [ ] End-to-end product journey works correctly

---

## 🎉 You're Done!

If all tests pass, your application is working correctly! 

**Next Steps:**
- See `TESTING_GUIDE.md` for detailed role testing
- See `DEPLOYMENT.md` for production deployment
- See `ARCHITECTURE.md` for system architecture

---

## 📝 Notes

- **Default Admin Credentials:**
  - Email: `admin@productledger.com`
  - Password: `admin123`

- **Database Credentials:**
  - User: `productledger`
  - Password: `productledger123`
  - Database: `product_ledger_users`
  - Port: `5432`

- **Service Ports:**
  - Frontend: `8080`
  - Backend: `3001`
  - Database: `5432`

- **Environment Files:**
  - Frontend: `.env` (root directory)
  - Backend: `server/.env`

