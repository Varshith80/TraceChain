# 🚀 Quick Commands Reference

## Windows PowerShell - One Command Startup

```powershell
# Run the automated startup script
.\start-project.ps1
```

---

## Manual Startup (Step by Step)

### 1. Start Fabric Network

```bash
# Navigate to fabric network
cd fabric-network

# Generate crypto material (first time only)
docker run --rm -v ${PWD}:/data hyperledger/fabric-tools:2.5 cryptogen generate --config=/data/crypto-config.yaml --output=/data/crypto-config

# Generate genesis block (first time only)
docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock /data/channel-artifacts/genesis.block

# Create channel transaction (first time only)
docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsChannel -outputCreateChannelTx /data/channel-artifacts/productledger-channel.tx -channelID productledger-channel

# Start Fabric network
docker-compose up -d

# Wait for containers to be ready
docker-compose ps

# Create and join channel (if not done automatically)
docker exec -it cli peer channel create -o orderer.example.com:7050 -c productledger-channel -f ./channel-artifacts/productledger-channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Deploy chaincode (if not done automatically)
cd scripts
./deploy-chaincode.sh
cd ..

# Go back to root
cd ..
```

### 2. Start Application Services

```bash
# Start PostgreSQL, Backend, Frontend
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Verify Everything

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:8080

# Check Fabric
docker exec -it cli peer channel list
```

---

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs postgres

# Fabric network
cd fabric-network
docker-compose logs -f
```

### Stop Services

```bash
# Stop application services
docker-compose down

# Stop Fabric network
cd fabric-network
docker-compose down

# Stop everything
docker-compose down
cd fabric-network && docker-compose down
```

### Restart Services

```bash
# Restart specific service
docker-compose restart backend

# Restart all
docker-compose restart
```

### Check Container Status

```bash
# All containers
docker ps

# Application containers
docker-compose ps

# Fabric containers
cd fabric-network
docker-compose ps
```

### Access Containers

```bash
# PostgreSQL
docker exec -it product-ledger-db psql -U productledger -d product_ledger_users

# Backend shell
docker exec -it product-ledger-backend sh

# Fabric CLI
docker exec -it cli bash
```

---

## Testing Commands

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","role":"consumer"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test Fabric Chaincode

```bash
# Query chaincode
docker exec -it cli peer chaincode query -C productledger-channel -n productledger -c '{"function":"GetMegaQR","Args":["MEGA-ID"]}'

# Invoke chaincode
docker exec -it cli peer chaincode invoke -o orderer.example.com:7050 -C productledger-channel -n productledger -c '{"function":"CreateMegaQR","Args":["..."]}' --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

---

## Troubleshooting Commands

### Check Ports

```powershell
# Windows PowerShell
netstat -ano | findstr :3001
netstat -ano | findstr :8080
netstat -ano | findstr :5432
```

```bash
# Linux/Mac
lsof -i :3001
lsof -i :8080
lsof -i :5432
```

### Clean Restart

```bash
# Stop everything
docker-compose down
cd fabric-network && docker-compose down

# Remove volumes (WARNING: Deletes data)
docker-compose down -v
cd fabric-network && docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# Disk usage
docker system df
```

---

## Environment Variables

### Backend (.env in server/)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_CONNECTION_PROFILE=../fabric-network/connection-profile.json
```

### Frontend (.env in root/)

```env
VITE_API_URL=http://localhost:3001/api
VITE_VERIFY_DOMAIN=localhost:8080
VITE_VERIFY_PROTOCOL=http
```

---

## URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Backend Health**: http://localhost:3001/health
- **Public Verification**: http://localhost:3001/v/{childID}

---

## Quick Test Flow

1. **Start everything**: `.\start-project.ps1` (Windows) or follow manual steps
2. **Open browser**: http://localhost:8080
3. **Register**: Create admin account
4. **Login**: Use credentials
5. **Create Product**: As manufacturer, create MegaQR
6. **Generate QR Codes**: Generate ChildQRs
7. **Verify**: Use public endpoint `/v/{childID}`

---

## Need Help?

- Check logs: `docker-compose logs -f`
- Check status: `docker-compose ps`
- Restart: `docker-compose restart`
- Full guide: See `START_PROJECT.md`

