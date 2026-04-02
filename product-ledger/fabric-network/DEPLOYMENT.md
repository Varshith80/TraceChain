# Hyperledger Fabric Network Deployment Guide

Complete step-by-step guide for deploying the Product Ledger Fabric network.

## Prerequisites Check

```bash
# Check Docker
docker --version
docker-compose --version

# Check if Fabric binaries are available (optional)
which cryptogen
which configtxgen
```

## Step 1: Initial Setup

Navigate to the fabric-network directory:

```bash
cd fabric-network
```

Make scripts executable:

```bash
chmod +x scripts/*.sh
```

## Step 2: Generate Network Artifacts

Run the network setup script:

```bash
./scripts/network-setup.sh
```

This will create:
- `crypto-config/` - All cryptographic material
- `channel-artifacts/genesis.block` - Genesis block for orderer
- `channel-artifacts/productledger-channel.tx` - Channel creation transaction
- `channel-artifacts/Org1MSPanchors.tx` - Anchor peer transaction for Org1
- `channel-artifacts/Org2MSPanchors.tx` - Anchor peer transaction for Org2

**Note**: If Fabric binaries are not installed, the script will use Docker to generate artifacts.

## Step 3: Start Network Containers

Start all network services:

```bash
docker-compose up -d
```

Verify all containers are running:

```bash
docker-compose ps
```

Expected output should show all services as "Up":
- orderer.example.com
- peer0.org1.example.com
- peer0.org2.example.com
- couchdb0
- couchdb1
- cli

Wait 30-60 seconds for services to initialize.

## Step 4: Create and Join Channel

Deploy the channel to the network:

```bash
./scripts/deploy-channel.sh
```

This script will:
1. Create the channel from Org1
2. Join Org1 peer to the channel
3. Update anchor peer for Org1
4. Join Org2 peer to the channel
5. Update anchor peer for Org2

Verify channel creation:

```bash
docker exec cli peer channel list
```

You should see `productledger-channel` in the list.

## Step 5: Deploy Chaincode

Deploy the Product Ledger chaincode:

```bash
./scripts/deploy-chaincode.sh
```

This script will:
1. Package the chaincode
2. Install on Org1 peer
3. Approve for Org1
4. Install on Org2 peer
5. Approve for Org2
6. Commit the chaincode definition

Verify chaincode deployment:

```bash
docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel --name productledger
```

## Step 6: Test Chaincode

Run test commands:

```bash
./scripts/test-chaincode.sh
```

Or test manually:

### Test 1: Create MegaQR
```bash
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

### Test 2: Query All MegaQRs (using CouchDB query)
```bash
docker exec cli peer chaincode query \
  -C productledger-channel \
  -n productledger \
  -c '{"function":"GetManufacturerMegaQRs","Args":["Org1MSP"]}'
```

## Step 7: Verify Network Health

### Check Orderer Logs
```bash
docker logs orderer.example.com
```

### Check Peer Logs
```bash
docker logs peer0.org1.example.com
docker logs peer0.org2.example.com
```

### Check CouchDB
```bash
# Org1 CouchDB
curl http://localhost:5984/_utils

# Org2 CouchDB
curl http://localhost:6984/_utils
```

### Check Channel Info
```bash
docker exec cli peer channel getinfo -c productledger-channel
```

## Common Issues and Solutions

### Issue: Containers fail to start

**Solution**: Check Docker resources
```bash
docker system df
docker system prune  # If needed
```

### Issue: Channel creation fails

**Solution**: Ensure orderer is ready
```bash
docker logs orderer.example.com
# Wait for "Starting orderer" message
```

### Issue: Chaincode deployment fails

**Solution**: Check chaincode path
```bash
# Verify chaincode exists
ls -la ../chaincode/productledger.go
```

### Issue: TLS handshake errors

**Solution**: Regenerate crypto material
```bash
docker-compose down -v
rm -rf crypto-config channel-artifacts
./scripts/network-setup.sh
docker-compose up -d
```

## Network Reset

To completely reset the network:

```bash
# Stop and remove containers
docker-compose down -v

# Remove generated artifacts
rm -rf crypto-config channel-artifacts

# Restart from Step 2
```

## Next Steps

1. **Enroll Users**: Create user identities for your application
2. **Update Connection Profile**: Update `connection-profile.json` with actual certificate paths
3. **Configure Backend**: Update backend environment variables
4. **Test Integration**: Test backend-to-Fabric integration

## Production Deployment Checklist

- [ ] Use production-grade certificates (not cryptogen)
- [ ] Configure proper network policies
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy
- [ ] Configure firewall rules
- [ ] Set up log aggregation
- [ ] Configure resource limits
- [ ] Review security settings
- [ ] Test disaster recovery
- [ ] Document runbooks

