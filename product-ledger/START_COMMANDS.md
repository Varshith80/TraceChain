# Complete Startup Commands - Product Ledger

## Quick Start (Without Fabric - Uses Mock Mode)

### Option 1: Use the PowerShell Script
```powershell
.\START_PROJECT.ps1
```

### Option 2: Manual Commands

#### 1. Start PostgreSQL Database
```powershell
docker-compose up -d postgres
```

Wait 8-10 seconds for database to be ready.

#### 2. Build Backend
```powershell
cd server
npm run build
cd ..
```

#### 3. Start Backend Server
```powershell
cd server
node dist/index.js
```
(Keep this terminal open, or run in background)

#### 4. Start Frontend (in a new terminal)
```powershell
npm run dev
```

#### 5. Access the Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

---

## Full Startup (With Hyperledger Fabric)

### Option 1: Use the PowerShell Script
```powershell
.\START_WITH_FABRIC.ps1
```

### Option 2: Manual Commands

#### Step 1: Setup Fabric Network (First Time Only)

**In Git Bash or WSL:**
```bash
cd fabric-network
chmod +x scripts/*.sh
./scripts/network-setup.sh
```

This generates:
- Cryptographic material
- Genesis block
- Channel transaction
- Anchor peer transactions

**Time:** ~2-3 minutes

#### Step 2: Start Fabric Network
```powershell
cd fabric-network
docker-compose up -d
```

Wait 15-20 seconds for all containers to start.

**Check status:**
```powershell
docker-compose ps
```

#### Step 3: Create Channel (First Time Only)

**In Git Bash or WSL:**
```bash
cd fabric-network
./scripts/deploy-channel.sh
```

This creates and joins the `productledger-channel`.

#### Step 4: Deploy Chaincode (First Time Only)

**In Git Bash or WSL:**
```bash
cd fabric-network
./scripts/deploy-chaincode.sh
```

This installs and commits the chaincode.

#### Step 5: Start PostgreSQL
```powershell
cd ..
docker-compose up -d postgres
```

Wait 8-10 seconds.

#### Step 6: Build Backend
```powershell
cd server
npm run build
cd ..
```

#### Step 7: Start Backend
```powershell
cd server
node dist/index.js
```

#### Step 8: Start Frontend (in a new terminal)
```powershell
npm run dev
```

---

## Verify Everything is Running

### Check Docker Containers
```powershell
docker ps
```

You should see:
- `product-ledger-db` (PostgreSQL)
- `orderer.example.com` (Fabric orderer)
- `peer0.org1.example.com` (Fabric peer)
- `peer0.org2.example.com` (Fabric peer)
- `couchdb0` and `couchdb1` (Fabric databases)
- `cli` (Fabric CLI)

### Check Backend Health
```powershell
curl http://localhost:3001/api/health
```

### Check Frontend
Open browser: http://localhost:8080

### Check Fabric Network
```powershell
docker exec cli peer channel list
```

Should show: `productledger-channel`

---

## Stop All Services

### Stop Docker Containers
```powershell
docker-compose down
cd fabric-network
docker-compose down
```

### Stop Node.js Processes
```powershell
# Find and kill backend
Get-Process -Name node | Where-Object {$_.Path -like "*server*"} | Stop-Process

# Find and kill frontend
Get-Process -Name node | Where-Object {$_.Path -like "*product-ledger*"} | Stop-Process
```

Or use the PIDs from the startup script.

---

## Troubleshooting

### Backend won't start
1. Check if port 3001 is in use:
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Check backend logs:
   ```powershell
   Get-Content server/logs/combined.log -Tail 50
   ```
3. Verify database is running:
   ```powershell
   docker ps | findstr postgres
   ```

### Frontend won't start
1. Check if port 8080 is in use:
   ```powershell
   netstat -ano | findstr :8080
   ```
2. Check if backend is running first
3. Verify `.env` file exists in root with `VITE_API_URL=http://localhost:3001/api`

### Fabric network issues
1. Check Fabric logs:
   ```powershell
   cd fabric-network
   docker-compose logs -f
   ```
2. Verify all containers are running:
   ```powershell
   docker-compose ps
   ```
3. Check if channel exists:
   ```powershell
   docker exec cli peer channel list
   ```

### Database connection errors
1. Verify PostgreSQL is healthy:
   ```powershell
   docker inspect product-ledger-db --format='{{.State.Health.Status}}'
   ```
2. Check database logs:
   ```powershell
   docker logs product-ledger-db
   ```
3. Verify connection string in `server/.env`:
   ```
   DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
   ```

---

## Environment Variables

### Backend (`server/.env`)
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
JWT_SECRET=dev-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_CONNECTION_PROFILE=../fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true
```

### Frontend (`.env` in root)
```
VITE_API_URL=http://localhost:3001/api
VITE_VERIFY_DOMAIN=localhost:8080
VITE_VERIFY_PROTOCOL=http
```

---

## Ports Used

- **3001**: Backend API
- **8080**: Frontend (Vite dev server)
- **5432**: PostgreSQL
- **7050**: Fabric Orderer
- **7051**: Fabric Peer0 Org1
- **9051**: Fabric Peer0 Org2
- **5984**: CouchDB Org1
- **6984**: CouchDB Org2

Make sure these ports are available before starting.

