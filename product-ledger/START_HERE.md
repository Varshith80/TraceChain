# 🚀 START HERE - Get Product Ledger Running

## ⚡ Quick Start (5 Minutes)

### Step 1: Start Database
```powershell
docker run -d --name product-ledger-db -e POSTGRES_USER=productledger -e POSTGRES_PASSWORD=productledger123 -e POSTGRES_DB=product_ledger_users -p 5432:5432 postgres:15-alpine
```

### Step 2: Start Backend Server
Open **Terminal 1** (PowerShell):
```powershell
cd server
npm run dev
```
**Wait for:** `🚀 Server running on port 3001`

### Step 3: Start Frontend
Open **Terminal 2** (PowerShell):
```powershell
npm run dev
```
**Wait for:** `Local: http://localhost:8080/`

### Step 4: Open Application
Open browser: **http://localhost:8080**

### Step 5: Login as Admin
- **Email:** `admin@productledger.com`
- **Password:** `admin123`

---

## 🧪 Test All Roles

### Test Admin (Already logged in)
1. ✅ View "All Users" section
2. ✅ See admin user listed
3. ✅ Try creating a new admin user

### Test Manufacturer
1. **Sign Up:**
   - Email: `manufacturer@test.com`
   - Password: `test123456`
   - Full Name: `Test Manufacturer`
   - Company: `Test Co.`
   - Role: **Manufacturer**
   - Click Sign Up

2. **Approve (as Admin):**
   - Sign in as admin
   - Find manufacturer user
   - Click "Approve"

3. **Test Manufacturer Features:**
   - Sign in as manufacturer
   - Click "Create MegaQR"
   - Fill form:
     - Product: `Test Product`
     - Batch No: `BATCH-001`
     - Mfg Date: Today
     - Expiry: Future date
     - Lot Size: `10`
   - Click "Create"
   - Click on created MegaQR
   - Click "Generate ChildQRs"
   - Enter: `5` children
   - Click "Generate"
   - Click "Commit Message"
   - Message: `Quality Checked`
   - Click "Commit"

### Test Retailer
1. **Sign Up:**
   - Email: `retailer@test.com`
   - Password: `test123456`
   - Role: **Retailer**

2. **Approve (as Admin)**

3. **Test Retailer Features:**
   - Sign in as retailer
   - Get a ChildQR ID from manufacturer (e.g., `MEGA-XXXXX-C00001`)
   - Paste in "Scan QR" or "Paste Hash"
   - Click "Lookup"
   - See product details
   - Click "Commit Message"
   - Message: `Received at Retailer`
   - Click "Commit"

### Test Consumer
1. **Sign Up:**
   - Email: `consumer@test.com`
   - Password: `test123456`
   - Role: **Consumer** (auto-approved!)

2. **Test Consumer Features:**
   - Sign in as consumer
   - Use same ChildQR ID from above
   - Paste in verification field
   - Click "Verify"
   - See:
     - ✅ Product is authentic
     - All manufacturer messages
     - All retailer messages
     - Complete timeline

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 8080
- [ ] Can login as admin
- [ ] Can create and approve users
- [ ] Manufacturer can create MegaQR
- [ ] Manufacturer can generate ChildQRs
- [ ] Retailer can lookup products
- [ ] Retailer can commit messages
- [ ] Consumer can verify products
- [ ] Consumer sees complete history

---

## 🐛 Troubleshooting

### Backend won't start?
```powershell
# Check if port is in use
netstat -an | findstr 3001

# Check database is running
docker ps

# Check server/.env exists
Test-Path server\.env
```

### Frontend can't connect?
- Verify backend is running
- Check `.env` file has: `VITE_API_URL=http://localhost:3001/api`
- Clear browser cache (Ctrl+Shift+Delete)

### Database error?
```powershell
# Restart database
docker restart product-ledger-db

# Check logs
docker logs product-ledger-db
```

### Authentication issues?
- Clear browser localStorage:
  - Press F12 (Developer Tools)
  - Console tab
  - Type: `localStorage.clear()`
  - Refresh page

---

## 📚 More Information

- **Detailed Testing:** See `TESTING_GUIDE.md`
- **Quick Commands:** See `QUICK_START.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Architecture:** See `ARCHITECTURE.md`

---

## 🎉 You're Ready!

Once all tests pass, your application is working correctly!

