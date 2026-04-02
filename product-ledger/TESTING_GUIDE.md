# Testing Guide - Product Ledger

This guide will help you get the application running and test all user roles.

## 🚀 Step 1: Prerequisites Check

### Check Node.js Version
```bash
node -v
# Should be v20 or higher
```

### Check if PostgreSQL is Available
```bash
# Option 1: Check if PostgreSQL is installed
psql --version

# Option 2: Use Docker (recommended)
docker --version
```

## 📦 Step 2: Install Dependencies

### Install Frontend Dependencies
```bash
npm install
```

### Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

## 🗄️ Step 3: Set Up Database

### Option A: Using Docker (Recommended)
```bash
docker run -d \
  --name product-ledger-db \
  -e POSTGRES_USER=productledger \
  -e POSTGRES_PASSWORD=productledger123 \
  -e POSTGRES_DB=product_ledger_users \
  -p 5432:5432 \
  postgres:15-alpine
```

### Option B: Using Local PostgreSQL
```bash
# Create database
createdb product_ledger_users

# Or using psql
psql -U postgres
CREATE DATABASE product_ledger_users;
CREATE USER productledger WITH PASSWORD 'productledger123';
GRANT ALL PRIVILEGES ON DATABASE product_ledger_users TO productledger;
\q
```

## ⚙️ Step 4: Configure Environment Variables

### Backend Configuration
Create `server/.env` file:

```bash
cd server
```

Create the file with this content:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
```

### Frontend Configuration
Create `.env` file in root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🏃 Step 5: Start the Services

### Terminal 1: Start Backend Server
```bash
cd server
npm run dev
```

**Expected output:**
```
🚀 Server running on port 3001
Environment: development
Health check: http://localhost:3001/health
Database connection established
Database schema initialized
Fabric connection initialized successfully
```

### Terminal 2: Start Frontend
```bash
# In root directory
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

## ✅ Step 6: Verify Services Are Running

### Check Backend Health
Open browser or use curl:
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-XX...",
  "service": "product-ledger-backend"
}
```

### Check Frontend
Open browser: http://localhost:8080

You should see the landing page.

## 👤 Step 7: Test Admin Role

### 7.1 Login as Admin

1. Go to http://localhost:8080
2. Click "Sign In" or navigate to `/auth`
3. Use credentials:
   - **Email:** `admin@productledger.com`
   - **Password:** `admin123`
4. Click "Sign In"

**Expected:** You should be redirected to Admin Dashboard

### 7.2 Test Admin Features

#### A. View All Users
1. On Admin Dashboard, you should see "All Users" section
2. You should see at least the admin user listed
3. Check user details, roles, and approval status

#### B. Approve a User (if you have pending users)
1. Find a user with "pending" status
2. Click "Approve" button
3. User status should change to "approved"

#### C. Create New Admin (Optional)
1. Click "Create Admin" button
2. Fill in the form:
   - Email: `admin2@productledger.com`
   - Password: `admin123`
   - Full Name: `Admin Two`
3. Submit
4. Verify new admin appears in users list

## 🏭 Step 8: Test Manufacturer Role

### 8.1 Create Manufacturer Account

1. Sign out from admin account
2. Go to Sign Up page
3. Fill in the form:
   - **Email:** `manufacturer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Manufacturer`
   - **Company Name:** `Test Manufacturing Co.`
   - **GST Number:** `GST123456`
   - **Role:** Select "Manufacturer"
4. Click "Sign Up"

**Expected:** 
- Account created successfully
- You'll see "Pending Approval" message
- You'll be redirected to Pending Approval page

### 8.2 Approve Manufacturer (as Admin)

1. Sign in as admin again
2. Go to Admin Dashboard
3. Find the manufacturer user you just created
4. Click "Approve" button
5. Status should change to "Approved"

### 8.3 Test Manufacturer Features

1. Sign in as manufacturer: `manufacturer@test.com` / `test123456`
2. You should see Manufacturer Dashboard

#### A. Create MegaQR
1. Click "Create MegaQR" button
2. Fill in the form:
   - **Product:** `Test Product`
   - **Batch No:** `BATCH-001`
   - **Manufacturing Date:** Select today's date
   - **Expiry Date:** Select a future date
   - **Lot Size:** `100`
   - **Notes:** `Test batch`
3. Click "Create"

**Expected:**
- MegaQR created successfully
- You see a success message
- MegaQR appears in the list with:
  - MegaID (e.g., MEGA-XXXXX)
  - Product name
  - Batch number
  - Status: Active

#### B. Generate ChildQRs
1. Find the MegaQR you just created
2. Click on it to view details
3. Click "Generate ChildQRs" button
4. Enter count: `10`
5. Click "Generate"

**Expected:**
- 10 ChildQR codes generated
- Each has a unique ChildID
- All linked to the MegaQR
- QR codes displayed

#### C. Commit Message to MegaQR
1. Select a MegaQR
2. Click "Commit Message" button
3. Enter message: `Quality Checked`
4. Optionally add location: `Warehouse A`
5. Click "Commit"

**Expected:**
- Message committed successfully
- Message appears in committed messages list
- All child QRs should also have this message

## 🏪 Step 9: Test Retailer Role

### 9.1 Create Retailer Account

1. Sign out
2. Sign up as Retailer:
   - **Email:** `retailer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Retailer`
   - **Company Name:** `Test Retail Store`
   - **Role:** Select "Retailer"
3. Sign up

### 9.2 Approve Retailer (as Admin)

1. Sign in as admin
2. Approve the retailer account

### 9.3 Test Retailer Features

1. Sign in as retailer: `retailer@test.com` / `test123456`
2. You should see Retailer Dashboard

#### A. Scan QR Code (or Paste Hash)
1. Get a ChildQR ID from manufacturer (e.g., `MEGA-XXXXX-C00001`)
2. In Retailer Dashboard, use "Scan QR" or "Paste Hash"
3. Paste the ChildID
4. Click "Lookup"

**Expected:**
- Product details displayed
- Committed messages from manufacturer visible
- Product snapshot information shown

#### B. Commit Message as Retailer
1. After viewing a product, click "Commit Message"
2. Enter message: `Received at Retailer`
3. Add location: `Store Location A`
4. Click "Commit"

**Expected:**
- Message committed successfully
- Message appears in product history
- Message shows retailer as the committer

#### C. View Commit History
1. Click "Commit History" button
2. You should see all committed messages
3. Try filtering by date (if available)

## 👥 Step 10: Test Consumer Role

### 10.1 Create Consumer Account

1. Sign out
2. Sign up as Consumer:
   - **Email:** `consumer@test.com`
   - **Password:** `test123456`
   - **Full Name:** `Test Consumer`
   - **Role:** Select "Consumer"
3. Sign up

**Note:** Consumers are auto-approved, so you can use the account immediately.

### 10.2 Test Consumer Features

1. Sign in as consumer: `consumer@test.com` / `test123456`
2. You should see Consumer Dashboard

#### A. Verify Product
1. Use a ChildQR ID from earlier (e.g., `MEGA-XXXXX-C00001`)
2. Paste it in the verification field
3. Click "Verify"

**Expected:**
- Verification result displayed
- Shows: Valid/Invalid
- Displays product information
- Shows complete message history
- Shows hash match status

#### B. View Product History
1. After verification, you should see:
   - All committed messages
   - Timeline of product journey
   - Manufacturer details
   - Retailer messages (if any)

#### C. Report Counterfeit (Optional)
1. If you want to test reporting:
   - Click "Report Counterfeit"
   - Fill in description
   - Submit
   - Report should be logged

## 🧪 Step 11: End-to-End Test Flow

### Complete Product Journey Test

1. **As Manufacturer:**
   - Create MegaQR: `"Premium Coffee Beans"`
   - Generate 5 ChildQRs
   - Commit message: `"Packed"`
   - Commit message: `"Quality Checked"`
   - Commit message: `"Shipped"`

2. **As Retailer:**
   - Lookup one of the ChildQRs
   - Verify you see all manufacturer messages
   - Commit message: `"Received at Retailer"`
   - Commit message: `"Stocked"`

3. **As Consumer:**
   - Verify the same ChildQR
   - You should see:
     - ✅ Product is authentic
     - All messages from manufacturer
     - All messages from retailer
     - Complete timeline

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is available
netstat -an | findstr 3001  # Windows
lsof -i :3001                # Mac/Linux

# Check database connection
cd server
# Verify DATABASE_URL in .env is correct
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
# Or
pg_isready  # If using local PostgreSQL

# Test connection
psql -U productledger -d product_ledger_users -h localhost
```

### Frontend can't connect to API
```bash
# Verify .env file has correct API URL
cat .env
# Should show: VITE_API_URL=http://localhost:3001/api

# Check backend is running
curl http://localhost:3001/health
```

### Authentication errors
```bash
# Clear browser localStorage
# Open browser console (F12)
localStorage.clear()

# Or manually remove token
localStorage.removeItem('auth_token')
```

### CORS errors
```bash
# Verify CORS_ORIGIN in server/.env matches frontend URL
# Should be: CORS_ORIGIN=http://localhost:8080
```

## ✅ Success Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:8080
- [ ] Health check endpoint returns OK
- [ ] Can sign up as new user
- [ ] Admin can login with default credentials
- [ ] Admin can view users
- [ ] Admin can approve users
- [ ] Manufacturer can create MegaQR
- [ ] Manufacturer can generate ChildQRs
- [ ] Manufacturer can commit messages
- [ ] Retailer can lookup products
- [ ] Retailer can commit messages
- [ ] Consumer can verify products
- [ ] Consumer sees complete product history
- [ ] All roles can access their respective dashboards

## 📊 Expected Test Results

### Admin Dashboard
- ✅ See all users
- ✅ Filter by role/status
- ✅ Approve/reject users
- ✅ View user details

### Manufacturer Dashboard
- ✅ Create MegaQR
- ✅ View all MegaQRs
- ✅ Generate ChildQRs
- ✅ Commit messages
- ✅ View QR code details

### Retailer Dashboard
- ✅ Scan/lookup products
- ✅ View product details
- ✅ Commit messages
- ✅ View commit history

### Consumer Dashboard
- ✅ Verify products
- ✅ View product authenticity
- ✅ See complete history
- ✅ Report counterfeits

## 🎉 You're Done!

If all tests pass, your application is working correctly! You can now:
- Deploy to production
- Add more features
- Customize for your needs

For production deployment, see `DEPLOYMENT.md`.

