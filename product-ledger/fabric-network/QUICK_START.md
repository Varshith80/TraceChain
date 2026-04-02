# Quick Start Guide - Hyperledger Fabric Network

Get your Fabric network up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 7050, 7051, 9051, 5984, 6984, 9443, 9444 available

## Step-by-Step Setup

### 1. Navigate to Fabric Network Directory
```bash
cd fabric-network
```

### 2. Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

### 3. Generate Network Artifacts
```bash
./scripts/network-setup.sh
```

**What this does:**
- Generates cryptographic material for all organizations
- Creates genesis block for the orderer
- Creates channel transaction
- Creates anchor peer transactions

**Time:** ~2-3 minutes

### 4. Start Network
```bash
docker-compose up -d
```

**What this starts:**
- Orderer node (Raft)
- 2 Peer nodes (Org1 and Org2)
- 2 CouchDB instances
- CLI tool

**Time:** ~30 seconds

### 5. Wait for Services
```bash
# Check status
docker-compose ps

# Wait until all services show "Up"
# Check logs if needed
docker-compose logs -f
```

**Time:** ~30-60 seconds

### 6. Create and Join Channel
```bash
./scripts/deploy-channel.sh
```

**What this does:**
- Creates `productledger-channel`
- Joins both organizations
- Updates anchor peers

**Time:** ~30 seconds

### 7. Deploy Chaincode
```bash
./scripts/deploy-chaincode.sh
```

**What this does:**
- Packages chaincode
- Installs on both peers
- Approves for both orgs
- Commits chaincode definition

**Time:** ~1-2 minutes

### 8. Test the Network
```bash
./scripts/test-chaincode.sh
```

Or manually test:

```bash
# Create a MegaQR
docker exec cli peer chaincode invoke \
  -o orderer.example.com:7050 \
  -C productledger-channel \
  -n productledger \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses peer0.org1.example.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses peer0.org2.example.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"CreateMegaQR","Args":["{\"product\":\"Test Product\",\"batchNo\":\"BATCH001\",\"mfgDate\":\"2024-01-01\",\"expiryDate\":\"2025-01-01\",\"manufacturerName\":\"Test Manufacturer\"}"]}'
```

## Verify Everything Works

### Check Network Status
```bash
# List channels
docker exec cli peer channel list

# Get channel info
docker exec cli peer channel getinfo -c productledger-channel

# List committed chaincodes
docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel
```

### Check CouchDB
```bash
# Org1 CouchDB
curl http://localhost:5984/_utils

# Org2 CouchDB  
curl http://localhost:6984/_utils
```

## Common Commands

### Stop Network
```bash
docker-compose down
```

### Start Network (after stop)
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f peer0.org1.example.com
```

### Clean Everything (Start Fresh)
```bash
./scripts/clean-network.sh
```

Then start from Step 3 again.

## Troubleshooting

### Containers won't start
```bash
# Check Docker resources
docker system df

# Restart Docker daemon (if needed)
# Then try again
```

### Channel creation fails
```bash
# Check orderer logs
docker logs orderer.example.com

# Ensure orderer is ready (look for "Starting orderer")
```

### Chaincode deployment fails
```bash
# Check chaincode path
ls -la ../chaincode/productledger.go

# Check peer logs
docker logs peer0.org1.example.com
```

## Next Steps

1. **Enroll Application Users**: Create identities for your backend application
2. **Update Backend Config**: Point your backend to the Fabric network
3. **Test Integration**: Verify backend can interact with chaincode

## Network Architecture

```
┌─────────────────┐
│   Orderer       │
│  (Raft)         │
│  Port: 7050     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Org1  │ │ Org2  │
│ Peer  │ │ Peer  │
│ 7051  │ │ 9051  │
└───┬───┘ └───┬───┘
    │         │
┌───▼───┐ ┌──▼────┐
│CouchDB│ │CouchDB│
│ 5984  │ │ 6984  │
└───────┘ └───────┘
```

## Support

For detailed documentation, see:
- `README.md` - Full network documentation
- `DEPLOYMENT.md` - Detailed deployment guide

