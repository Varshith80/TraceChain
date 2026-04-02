# 🚀 Complete Project Startup Guide

This guide will help you start the entire Product Ledger system from scratch and test it.

---

## 📋 Prerequisites Check

First, verify you have the required tools installed:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js (if running locally)
node --version
npm --version
```

**Required:**
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 8GB RAM available for Docker
- Ports available: 3001 (backend), 8080 (frontend), 5432 (PostgreSQL), 7050-7051 (Fabric)

---

## 🎯 Step-by-Step Startup

### **STEP 1: Start Hyperledger Fabric Network**

The Fabric network must be started FIRST before the backend.

#### 1.1 Navigate to Fabric Network Directory

```bash
cd fabric-network
```

#### 1.2 Generate Crypto Material and Channel Artifacts

```bash
# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh

# Run network setup script
./scripts/network-setup.sh
```

**OR** if you're on Windows (PowerShell), use Docker directly:

```powershell
# Generate crypto material
docker run --rm -v ${PWD}:/data hyperledger/fabric-tools:2.5 cryptogen generate --config=/data/crypto-config.yaml --output=/data/crypto-config

# Generate genesis block
docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock /data/channel-artifacts/genesis.block

# Create channel transaction
docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsChannel -outputCreateChannelTx /data/channel-artifacts/productledger-channel.tx -channelID productledger-channel

# Generate anchor peer transactions
docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate /data/channel-artifacts/Org1MSPanchors.tx -channelID productledger-channel -asOrg Org1MSP

docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate /data/channel-artifacts/Org2MSPanchors.tx -channelID productledger-channel -asOrg Org2MSP
```

#### 1.3 Start Fabric Network

```bash
# Start all Fabric services (orderer, peers, CouchDB)
docker-compose up -d
```

**Wait for all containers to be healthy** (check with):
```bash
docker-compose ps
```

You should see:
- `orderer.example.com` - Running
- `peer0.org1.example.com` - Running
- `peer0.org2.example.com` - Running
- `couchdb0` - Running
- `couchdb1` - Running

#### 1.4 Create and Join Channel

```bash
# Create channel
./scripts/deploy-channel.sh

# OR manually with Docker:
docker exec -it cli peer channel create -o orderer.example.com:7050 -c productledger-channel -f ./channel-artifacts/productledger-channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

#### 1.5 Deploy Chaincode

```bash
# Deploy chaincode
./scripts/deploy-chaincode.sh

# This will:
# 1. Package chaincode
# 2. Install on both peers
# 3. Approve chaincode
# 4. Commit chaincode
```

**Verify chaincode is deployed:**
```bash
docker exec -it cli peer lifecycle chaincode querycommitted --channelID productledger-channel --name productledger
```

---

### **STEP 2: Start Application Services (PostgreSQL + Backend + Frontend)**

#### 2.1 Navigate Back to Root Directory

```bash
cd ..
```

#### 2.2 Create Environment Files

**Backend Environment** (`server/.env`):
```bash
cd server
cat > .env << 'EOF'
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_CONNECTION_PROFILE=../fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true
FABRIC_ENABLE_EVENT_LISTENER=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
EOF
cd ..
```

**Frontend Environment** (`.env` in root):
```bash
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
VITE_VERIFY_DOMAIN=localhost:8080
VITE_VERIFY_PROTOCOL=http
EOF
```

#### 2.3 Start with Docker Compose (Recommended)

```bash
# Start PostgreSQL, Backend, and Frontend
docker-compose up -d
```

**OR** start services individually:

```bash
# 1. Start PostgreSQL only
docker-compose up -d postgres

# Wait for PostgreSQL to be healthy
docker-compose ps postgres

# 2. Start Backend
docker-compose up -d backend

# 3. Start Frontend
docker-compose up -d frontend
```

#### 2.4 Check Service Status

```bash
# Check all containers
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs postgres
```

---

### **STEP 3: Initialize Database Schema**

The backend should automatically create tables on first startup. If not:

```bash
# Connect to PostgreSQL
docker exec -it product-ledger-db psql -U productledger -d product_ledger_users

# Or run the init script
docker exec -it product-ledger-backend npm run init-db
```

---

### **STEP 4: Verify Everything is Running**

#### 4.1 Check Backend Health

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "fabric": "connected"
}
```

#### 4.2 Check Frontend

Open browser: **http://localhost:8080**

You should see the Product Ledger login page.

#### 4.3 Check Fabric Connection

```bash
# Check backend logs for Fabric connection
docker logs product-ledger-backend | grep -i fabric

# Should see:
# ✅ Gateway connected successfully
# ✅ Network "productledger-channel" connected
# ✅ Hyperledger Fabric connection initialized successfully
```

---

## 🧪 Testing the System

### **Test 1: Create Admin User (First Time)**

The system should auto-create an admin user. If not:

```bash
# Check if admin exists
curl http://localhost:3001/api/auth/check

# Create admin (if needed)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@productledger.com",
    "password": "admin123",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

### **Test 2: Login and Get JWT Token**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@productledger.com",
    "password": "admin123"
  }'
```

**Save the token** from response for next requests.

### **Test 3: Create Manufacturer Account**

```bash
# Register manufacturer
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manufacturer@test.com",
    "password": "test123456",
    "fullName": "Test Manufacturer",
    "companyName": "Test Company",
    "role": "manufacturer"
  }'

# Login as admin and approve
curl -X POST http://localhost:3001/api/admin/users/MANUFACTURER_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Test 4: Create MegaQR (Blockchain Transaction)**

```bash
curl -X POST http://localhost:3001/api/megaqr \
  -H "Authorization: Bearer YOUR_MANUFACTURER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Product",
    "batchNo": "BATCH-001",
    "mfgDate": "2024-01-01",
    "expiryDate": "2025-01-01",
    "lotSize": 100
  }'
```

**This should:**
- Submit transaction to Fabric blockchain
- Return `megaID` and `megaHash`
- Create entry in PostgreSQL read mirror

### **Test 5: Generate ChildQRs**

```bash
curl -X POST http://localhost:3001/api/megaqr/MEGA_ID/generate-children \
  -H "Authorization: Bearer YOUR_MANUFACTURER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5
  }'
```

### **Test 6: Verify Product (Public Endpoint)**

```bash
# Get a childID from previous step, then:
curl http://localhost:3001/v/CHILD_ID
```

**Expected response:**
```json
{
  "valid": true,
  "hashMatch": true,
  "message": "Product is authentic",
  "childID": "CHILD_ID",
  "product": {
    "childID": "...",
    "childHash": "...",
    "status": "active"
  }
}
```

---

## 🔍 Troubleshooting

### **Fabric Network Issues**

```bash
# Check Fabric containers
docker-compose -f fabric-network/docker-compose.yaml ps

# View Fabric logs
docker-compose -f fabric-network/docker-compose.yaml logs orderer.example.com
docker-compose -f fabric-network/docker-compose.yaml logs peer0.org1.example.com

# Restart Fabric network
cd fabric-network
docker-compose down
docker-compose up -d
```

### **Backend Connection to Fabric Fails**

1. **Check connection profile exists:**
   ```bash
   ls -la fabric-network/connection-profile.json
   ```

2. **Check wallet exists:**
   ```bash
   ls -la server/wallet
   ```

3. **Check backend logs:**
   ```bash
   docker logs product-ledger-backend
   ```

4. **Verify Fabric is running:**
   ```bash
   docker exec -it cli peer channel list
   ```

### **Database Connection Issues**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs product-ledger-db

# Test connection
docker exec -it product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT 1;"
```

### **Port Already in Use**

```bash
# Find process using port
# Windows PowerShell:
netstat -ano | findstr :3001
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# Linux/Mac:
lsof -i :3001
lsof -i :8080
lsof -i :5432

# Kill process or change ports in docker-compose.yml
```

---

## 📊 Monitoring Commands

### **View All Running Containers**

```bash
docker ps
```

### **View Logs (Real-time)**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### **Check Resource Usage**

```bash
docker stats
```

### **Check Network Connectivity**

```bash
# Test backend API
curl http://localhost:3001/health

# Test frontend
curl http://localhost:8080

# Test Fabric peer
docker exec -it peer0.org1.example.com peer channel list
```

---

## 🛑 Stopping the System

### **Stop Application Services**

```bash
docker-compose down
```

### **Stop Fabric Network**

```bash
cd fabric-network
docker-compose down
```

### **Stop Everything (Clean Shutdown)**

```bash
# Stop application
docker-compose down

# Stop Fabric
cd fabric-network
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v
cd fabric-network
docker-compose down -v
```

---

## ✅ Success Checklist

- [ ] Fabric network is running (orderer + 2 peers + 2 CouchDB)
- [ ] Channel created and joined
- [ ] Chaincode deployed and committed
- [ ] PostgreSQL is running and healthy
- [ ] Backend connects to Fabric (check logs)
- [ ] Backend connects to PostgreSQL
- [ ] Frontend is accessible at http://localhost:8080
- [ ] Health endpoint returns OK
- [ ] Can create MegaQR (blockchain transaction)
- [ ] Can verify product (public endpoint)

---

## 🎉 Next Steps

Once everything is running:

1. **Create test accounts** for each role (Admin, Manufacturer, Retailer, Consumer)
2. **Create a product** (MegaQR + ChildQRs)
3. **Test the full flow**: Create → Scan → Verify
4. **Check blockchain** to verify transactions are recorded
5. **Check PostgreSQL mirror** to verify data sync

**Happy Testing! 🚀**

