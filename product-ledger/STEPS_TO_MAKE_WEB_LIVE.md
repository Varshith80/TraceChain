# Complete Steps to Make the Website Live

This guide provides step-by-step commands to deploy the Product Ledger application with Hyperledger Fabric blockchain integration.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- Git Bash or WSL (for running Fabric setup scripts on Windows)
- At least 8GB RAM available
- Ports available: 3001, 8080, 5432, 7050, 7051, 9051, 5984, 6984

---

## Option 1: Quick Start (Mock Mode - Testing Only)

**Use this for quick testing without Fabric network**

### Step 1: Start PostgreSQL Database

```powershell
# Navigate to project root
cd C:\Users\Maniv\TraceChain\product-ledger

# Start PostgreSQL
docker-compose up -d postgres

# Wait 10 seconds for database to be ready
Start-Sleep -Seconds 10

# Verify database is running
docker ps | Select-String "product-ledger-db"
```

**Expected Output:** Container should show as "healthy"

### Step 2: Configure Backend for Mock Mode

```powershell
# Navigate to server directory
cd server

# Update .env file to enable mock mode
(Get-Content .env) -replace 'FABRIC_USE_MOCK=false', 'FABRIC_USE_MOCK=true' | Set-Content .env

# Verify the change
Get-Content .env | Select-String "FABRIC_USE_MOCK"
```

**Expected Output:** `FABRIC_USE_MOCK=true`

### Step 3: Build Backend

```powershell
# Make sure you're in server directory
cd C:\Users\Maniv\TraceChain\product-ledger\server

# Install dependencies (if not already done)
npm install

# Build TypeScript code
npm run build
```

**Expected Output:** Build should complete without errors

### Step 4: Start Backend Server

```powershell
# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Maniv\TraceChain\product-ledger\server'; node dist/index.js"
```

**Wait 5-10 seconds**, then verify backend is running:

```powershell
# Check if backend is responding
curl http://localhost:3001/api/health
```

**Expected Output:** `{"status":"ok","timestamp":"...","service":"product-ledger-backend"}`

### Step 5: Start Frontend

```powershell
# Navigate to project root
cd C:\Users\Maniv\TraceChain\product-ledger

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Maniv\TraceChain\product-ledger'; npm run dev"
```

**Wait 10-15 seconds**, then verify frontend is running:

```powershell
# Check if frontend is responding
curl http://localhost:8080
```

**Expected Output:** HTML content from the frontend

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## Option 2: Full Deployment (With Hyperledger Fabric)

**Use this for production-ready deployment with real blockchain**

### Step 1: Start PostgreSQL Database

```powershell
# Navigate to project root
cd C:\Users\Maniv\TraceChain\product-ledger

# Start PostgreSQL
docker-compose up -d postgres

# Wait 10 seconds
Start-Sleep -Seconds 10

# Verify database is running
docker ps | Select-String "product-ledger-db"
```

### Step 2: Setup Hyperledger Fabric Network (First Time Only)

**Note:** These commands need to be run in Git Bash or WSL on Windows.

#### 2.1: Navigate to Fabric Network Directory

```bash
cd fabric-network
```

#### 2.2: Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

#### 2.3: Generate Network Artifacts

```bash
./scripts/network-setup.sh
```

**What this does:**
- Generates cryptographic material for all organizations
- Creates genesis block for the orderer
- Creates channel transaction
- Creates anchor peer transactions

**Time:** ~2-3 minutes

**Expected Output:** 
```
✅ Crypto material generated
✅ Genesis block created
✅ Channel transaction created
✅ Anchor peer transactions created
```

#### 2.4: Start Fabric Network

```powershell
# In PowerShell (from project root)
cd fabric-network
docker-compose up -d
```

**Wait 20-30 seconds** for all containers to start.

**Verify containers are running:**

```powershell
docker-compose ps
```

**Expected Output:** All services should show "Up" status:
- orderer.example.com
- peer0.org1.example.com
- peer0.org2.example.com
- couchdb0
- couchdb1
- cli

#### 2.5: Create and Join Channel

**In Git Bash or WSL:**

```bash
cd fabric-network
./scripts/deploy-channel.sh
```

**What this does:**
- Creates `productledger-channel`
- Joins both organizations to the channel
- Updates anchor peers

**Time:** ~30 seconds

**Expected Output:**
```
✅ Channel created
✅ Org1 joined channel
✅ Org2 joined channel
✅ Anchor peers updated
```

#### 2.6: Deploy Chaincode

**In Git Bash or WSL:**

```bash
cd fabric-network
./scripts/deploy-chaincode.sh
```

**What this does:**
- Packages chaincode
- Installs on both peers
- Approves for both orgs
- Commits chaincode definition

**Time:** ~1-2 minutes

**Expected Output:**
```
✅ Chaincode packaged
✅ Chaincode installed on peer0.org1
✅ Chaincode installed on peer0.org2
✅ Chaincode approved by Org1
✅ Chaincode approved by Org2
✅ Chaincode committed
```

#### 2.7: Verify Fabric Network

**In PowerShell:**

```powershell
# Check if channel exists
docker exec cli peer channel list

# Check if chaincode is deployed
docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel
```

**Expected Output:**
- Channel list should show `productledger-channel`
- Chaincode should show `productledger` with version

### Step 3: Enroll Application User Identity

The backend needs an identity to interact with Fabric. You need to enroll a user.

#### Option A: Use Existing User Identity (Recommended)

If you have existing crypto material, copy the user certificate and key:

```powershell
# Create wallet directory
New-Item -ItemType Directory -Force -Path "server\wallet"

# Copy user identity from Fabric crypto material
# Replace with actual paths from your Fabric network
Copy-Item "fabric-network\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\signcerts\*.pem" -Destination "server\wallet\appUser-cert.pem"
Copy-Item "fabric-network\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\keystore\*.pem" -Destination "server\wallet\appUser-key.pem"
```

#### Option B: Enroll via CA (If CA is running)

```bash
# In Git Bash or WSL
cd fabric-network

# Enroll admin
fabric-ca-client enroll -u https://admin:adminpw@ca.org1.example.com:7054

# Register new user
fabric-ca-client register --id.name appUser --id.secret appUserPw --id.type user

# Enroll the user
fabric-ca-client enroll -u https://appUser:appUserPw@ca.org1.example.com:7054 -M ./wallet/appUser
```

### Step 4: Configure Backend for Fabric

```powershell
# Navigate to server directory
cd C:\Users\Maniv\TraceChain\product-ledger\server

# Update .env file to disable mock mode
(Get-Content .env) -replace 'FABRIC_USE_MOCK=true', 'FABRIC_USE_MOCK=false' | Set-Content .env

# Verify the change
Get-Content .env | Select-String "FABRIC_USE_MOCK"
```

**Expected Output:** `FABRIC_USE_MOCK=false`

**Verify .env has correct Fabric settings:**

```powershell
Get-Content .env | Select-String "FABRIC_"
```

**Should show:**
```
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_CONNECTION_PROFILE=../fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true
```

### Step 5: Build Backend

```powershell
# Make sure you're in server directory
cd C:\Users\Maniv\TraceChain\product-ledger\server

# Build TypeScript code
npm run build
```

**Expected Output:** Build should complete without errors

### Step 6: Start Backend Server

```powershell
# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Maniv\TraceChain\product-ledger\server'; node dist/index.js"
```

**Wait 10-15 seconds**, then check the backend window for logs.

**Expected Logs:**
```
✅ Database initialized successfully
✅ Gateway connected successfully
✅ Network "productledger-channel" connected
✅ Hyperledger Fabric connection initialized successfully
✅ Blockchain is now the source of truth for product data
🚀 Server running on port 3001
```

**Verify backend is running:**

```powershell
curl http://localhost:3001/api/health
```

**Expected Output:** `{"status":"ok","timestamp":"...","service":"product-ledger-backend"}`

### Step 7: Start Frontend

```powershell
# Navigate to project root
cd C:\Users\Maniv\TraceChain\product-ledger

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Maniv\TraceChain\product-ledger'; npm run dev"
```

**Wait 10-15 seconds**, then verify frontend is running:

```powershell
curl http://localhost:8080
```

### Step 8: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Public Verification**: http://localhost:3001/v/{childID}

---

## Verification Checklist

After starting all services, verify:

### ✅ Database
```powershell
docker ps | Select-String "product-ledger-db"
# Should show: healthy status
```

### ✅ Backend
```powershell
curl http://localhost:3001/api/health
# Should return: {"status":"ok",...}
```

### ✅ Frontend
```powershell
curl http://localhost:8080
# Should return: HTML content
```

### ✅ Fabric Network (if using Option 2)
```powershell
docker exec cli peer channel list
# Should show: productledger-channel

docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel
# Should show: productledger chaincode
```

---

## Troubleshooting

### Backend Won't Start

**Error:** `Identity "appUser" not found in wallet`

**Solution:**
1. Make sure you've enrolled the identity (Step 3 in Option 2)
2. Or enable mock mode for testing (Option 1)

**Error:** `Failed to connect to Fabric network`

**Solution:**
1. Verify Fabric network is running: `docker-compose ps` (in fabric-network directory)
2. Check connection profile path in `server/.env`
3. Verify channel exists: `docker exec cli peer channel list`

### Frontend Won't Start

**Error:** Port 8080 already in use

**Solution:**
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Database Connection Error

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
```powershell
# Check if PostgreSQL is running
docker ps | Select-String "postgres"

# Check database logs
docker logs product-ledger-db

# Restart database
docker-compose restart postgres
```

### Fabric Network Issues

**Error:** Containers won't start

**Solution:**
```powershell
cd fabric-network

# Check logs
docker-compose logs

# Restart network
docker-compose down
docker-compose up -d
```

**Error:** Channel creation fails

**Solution:**
```powershell
# Check orderer logs
docker logs orderer.example.com

# Ensure orderer is ready (look for "Starting orderer")
# Wait 30 seconds and try again
```

---

## Stopping All Services

### Stop Docker Containers

```powershell
# Stop PostgreSQL
docker-compose down

# Stop Fabric network
cd fabric-network
docker-compose down
cd ..
```

### Stop Node.js Processes

```powershell
# Find and stop backend
Get-Process -Name node | Where-Object {$_.Path -like "*server*"} | Stop-Process

# Find and stop frontend
Get-Process -Name node | Where-Object {$_.Path -like "*product-ledger*"} | Stop-Process
```

Or simply close the PowerShell windows where backend and frontend are running.

---

## Quick Reference Commands

### Start Everything (Mock Mode)
```powershell
.\QUICK_START.ps1
```

### Start Everything (With Fabric)
```powershell
.\START_WITH_FABRIC.ps1
```

### Check Service Status
```powershell
# Database
docker ps | Select-String "product-ledger-db"

# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:8080

# Fabric
docker exec cli peer channel list
```

### View Logs
```powershell
# Backend logs
Get-Content server\logs\combined.log -Tail 50

# Database logs
docker logs product-ledger-db -f

# Fabric logs
cd fabric-network
docker-compose logs -f
```

---

## Next Steps After Deployment

1. **Create Admin Account**: Sign up at http://localhost:8080
2. **Create Manufacturer Account**: Sign up with manufacturer role
3. **Create MegaQR**: Create a product batch
4. **Generate ChildQRs**: Generate individual QR codes
5. **Test Verification**: Scan a QR code and verify authenticity

---

## Production Deployment Notes

For production deployment:

1. **Change JWT Secret**: Update `JWT_SECRET` in `server/.env`
2. **Disable Mock Mode**: Ensure `FABRIC_USE_MOCK=false`
3. **Use Real Certificates**: Don't use `asLocalhost=true` in production
4. **Configure CORS**: Update `CORS_ORIGIN` in `server/.env`
5. **Enable HTTPS**: Use reverse proxy (nginx) with SSL certificates
6. **Database Security**: Use strong passwords and restrict access
7. **Fabric Network**: Deploy to production infrastructure (not Docker Compose)

---

## Support

If you encounter issues:

1. Check the logs in `server/logs/combined.log`
2. Check Docker container logs: `docker logs <container-name>`
3. Verify all environment variables in `server/.env`
4. Ensure all required ports are available
5. Check Fabric network status: `docker-compose ps` (in fabric-network directory)

