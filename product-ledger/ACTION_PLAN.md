# 🎯 Action Plan - Make It Live & Test

## Current Status Check

Based on the system check:
- ✅ Frontend .env exists
- ✅ Frontend dependencies installed
- ❌ Backend .env needs to be created
- ❌ Backend dependencies need to be installed
- ❌ Database needs to be started

---

## 📋 Step-by-Step Actions

### STEP 1: Create Backend Environment File

**Action:** Create `server/.env` file manually

**Location:** `server/.env`

**Content:**
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-this-in-production-12345678901234567890
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
```

**How to create:**
1. Navigate to `server` folder
2. Create new file named `.env`
3. Copy the content above into it
4. Save the file

---

### STEP 2: Install Backend Dependencies

**Action:** Run this command in PowerShell

```powershell
cd server
npm install
cd ..
```

**Expected:** Dependencies will be installed (may take 1-2 minutes)

---

### STEP 3: Start Database

**Option A: Using Docker (Recommended)**

**Action:** Start Docker Desktop first, then run:

```powershell
docker run -d --name product-ledger-db -e POSTGRES_USER=productledger -e POSTGRES_PASSWORD=productledger123 -e POSTGRES_DB=product_ledger_users -p 5432:5432 postgres:15-alpine
```

**Verify it's running:**
```powershell
docker ps
```
You should see `product-ledger-db` in the list.

**Option B: Using Local PostgreSQL**

If you have PostgreSQL installed locally:
1. Create database: `createdb product_ledger_users`
2. Update `DATABASE_URL` in `server/.env` with your credentials

---

### STEP 4: Start Backend Server

**Action:** Open **PowerShell Terminal 1**

```powershell
cd server
npm run dev
```

**What to look for:**
```
🚀 Server running on port 3001
Environment: development
Health check: http://localhost:3001/health
Database connection established
Database schema initialized
Fabric connection initialized successfully
```

**✅ Success:** You see "Server running on port 3001"

**❌ Error?** Check:
- Is port 3001 free? (Close other apps using it)
- Is database running? (Check Docker)
- Does `server/.env` exist?

---

### STEP 5: Start Frontend

**Action:** Open **PowerShell Terminal 2** (keep Terminal 1 running!)

```powershell
npm run dev
```

**What to look for:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
```

**✅ Success:** You see the local URL

---

### STEP 6: Verify Services

**Action:** Open browser and test

1. **Backend Health Check:**
   - Go to: http://localhost:3001/health
   - Should see: `{"status":"ok",...}`

2. **Frontend:**
   - Go to: http://localhost:8080
   - Should see: Landing page or login page

---

## 🧪 STEP 7: Test Admin Role

### 7.1 Login as Admin

**Action:**
1. Go to http://localhost:8080
2. Click "Sign In" or go to `/auth`
3. Enter:
   - **Email:** `admin@productledger.com`
   - **Password:** `admin123`
4. Click "Sign In"

**Expected Result:**
- ✅ Redirected to Admin Dashboard
- ✅ See "All Users" section
- ✅ See admin user in the list

### 7.2 Test Admin Features

**A. View Users**
- ✅ Should see at least the admin user
- ✅ Can see user details, roles, approval status

**B. Create New Admin (Optional)**
1. Click "Create Admin"
2. Fill form:
   - Email: `admin2@test.com`
   - Password: `admin123`
   - Full Name: `Admin Two`
3. Submit
4. ✅ New admin appears in users list

---

## 🏭 STEP 8: Test Manufacturer Role

### 8.1 Create Manufacturer Account

**Action:**
1. Sign out from admin
2. Go to Sign Up page
3. Fill form:
   - **Email:** `manufacturer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Manufacturer`
   - **Company Name:** `Test Manufacturing Co.`
   - **GST Number:** `GST123456`
   - **Role:** Select **"Manufacturer"**
4. Click "Sign Up"

**Expected:**
- ✅ Account created
- ✅ See "Pending Approval" message
- ✅ Redirected to Pending Approval page

### 8.2 Approve Manufacturer

**Action:**
1. Sign in as admin again
2. Go to Admin Dashboard
3. Find `manufacturer@test.com`
4. Click "Approve" button

**Expected:**
- ✅ Status changes to "Approved"

### 8.3 Test Manufacturer Features

**Action:** Sign in as manufacturer

**Credentials:**
- Email: `manufacturer@test.com`
- Password: `test123456`

**A. Create MegaQR**
1. Click "Create MegaQR" button
2. Fill form:
   - **Product:** `Test Product`
   - **Batch No:** `BATCH-001`
   - **Manufacturing Date:** Select today
   - **Expiry Date:** Select future date
   - **Lot Size:** `10`
   - **Notes:** `Test batch`
3. Click "Create"

**Expected:**
- ✅ Success message
- ✅ MegaQR appears in list
- ✅ Has MegaID (e.g., `MEGA-XXXXX`)
- ✅ Status: Active

**B. Generate ChildQRs**
1. Click on the MegaQR you created
2. Click "Generate ChildQRs"
3. Enter count: `5`
4. Click "Generate"

**Expected:**
- ✅ 5 ChildQR codes generated
- ✅ Each has unique ChildID
- ✅ QR codes displayed

**C. Commit Message**
1. Select the MegaQR
2. Click "Commit Message"
3. Enter: `Quality Checked`
4. Location (optional): `Warehouse A`
5. Click "Commit"

**Expected:**
- ✅ Message committed
- ✅ Appears in committed messages
- ✅ All child QRs also updated

---

## 🏪 STEP 9: Test Retailer Role

### 9.1 Create Retailer Account

**Action:**
1. Sign out
2. Sign up:
   - **Email:** `retailer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Retailer`
   - **Company:** `Test Retail Store`
   - **Role:** **Retailer**
3. Sign up

### 9.2 Approve Retailer

**Action:**
1. Sign in as admin
2. Approve `retailer@test.com`

### 9.3 Test Retailer Features

**Action:** Sign in as retailer

**Credentials:**
- Email: `retailer@test.com`
- Password: `test123456`

**A. Lookup Product**
1. Get a ChildQR ID from manufacturer (e.g., `MEGA-XXXXX-C00001`)
2. Paste in "Scan QR" or "Paste Hash" field
3. Click "Lookup"

**Expected:**
- ✅ Product details displayed
- ✅ Manufacturer messages visible
- ✅ Product snapshot shown

**B. Commit Message**
1. After viewing product, click "Commit Message"
2. Enter: `Received at Retailer`
3. Location: `Store Location A`
4. Click "Commit"

**Expected:**
- ✅ Message committed
- ✅ Appears in product history
- ✅ Shows retailer as committer

**C. View History**
1. Click "Commit History"
2. ✅ See all committed messages
3. ✅ Can filter by date (if available)

---

## 👥 STEP 10: Test Consumer Role

### 10.1 Create Consumer Account

**Action:**
1. Sign out
2. Sign up:
   - **Email:** `consumer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Consumer`
   - **Role:** **Consumer**
3. Sign up

**Note:** ✅ Consumers are **auto-approved**!

### 10.2 Test Consumer Features

**Action:** Sign in as consumer

**Credentials:**
- Email: `consumer@test.com`
- Password: `test123456`

**A. Verify Product**
1. Use ChildQR ID from earlier (e.g., `MEGA-XXXXX-C00001`)
2. Paste in verification field
3. Click "Verify"

**Expected:**
- ✅ Verification result shown
- ✅ Shows: Valid/Invalid
- ✅ Product information displayed
- ✅ Complete message history
- ✅ Hash match status

**B. View Product History**
- ✅ All committed messages
- ✅ Timeline of product journey
- ✅ Manufacturer details
- ✅ Retailer messages

---

## 🎯 Complete End-to-End Test

### Full Product Journey

**1. As Manufacturer:**
- Create MegaQR: `"Premium Coffee Beans"`
- Generate 5 ChildQRs
- Commit: `"Packed"`
- Commit: `"Quality Checked"`
- Commit: `"Shipped"`

**2. As Retailer:**
- Lookup one ChildQR
- See all manufacturer messages
- Commit: `"Received at Retailer"`
- Commit: `"Stocked"`

**3. As Consumer:**
- Verify the same ChildQR
- ✅ See: Product is authentic
- ✅ See: All manufacturer messages
- ✅ See: All retailer messages
- ✅ See: Complete timeline

---

## ✅ Success Checklist

Mark each as you complete:

- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:8080
- [ ] Health check returns OK
- [ ] Can sign up as new user
- [ ] Admin can login
- [ ] Admin can view users
- [ ] Admin can approve users
- [ ] Manufacturer can create MegaQR
- [ ] Manufacturer can generate ChildQRs
- [ ] Manufacturer can commit messages
- [ ] Retailer can lookup products
- [ ] Retailer can commit messages
- [ ] Consumer can verify products
- [ ] Consumer sees complete history
- [ ] All roles can access dashboards

---

## 🐛 Troubleshooting

### Backend won't start?
```powershell
# Check port
netstat -an | findstr 3001

# Check database
docker ps

# Check .env file
Test-Path server\.env
```

### Frontend can't connect?
- Verify backend is running
- Check `.env` has correct API URL
- Clear browser cache

### Database error?
```powershell
# Restart database
docker restart product-ledger-db

# Check logs
docker logs product-ledger-db
```

### Authentication issues?
- Clear localStorage: F12 → Console → `localStorage.clear()`
- Refresh page

---

## 🎉 You're Done!

Once all tests pass, your application is **fully functional** and ready for use!

For production deployment, see `DEPLOYMENT.md`.

