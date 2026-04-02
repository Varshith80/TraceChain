# Hyperledger Fabric Network Setup

This document provides an overview of the Hyperledger Fabric network setup for Product Ledger.

## Quick Links

- **Quick Start**: [`fabric-network/QUICK_START.md`](fabric-network/QUICK_START.md)
- **Full Documentation**: [`fabric-network/README.md`](fabric-network/README.md)
- **Deployment Guide**: [`fabric-network/DEPLOYMENT.md`](fabric-network/DEPLOYMENT.md)

## Network Overview

The Product Ledger Fabric network is configured with:

- **2 Organizations**: Org1 and Org2
- **1 Channel**: `productledger-channel`
- **Ordering Service**: Raft (etcdraft) - 1 orderer node
- **State Database**: CouchDB (enabled for rich queries)
- **TLS**: Enabled for all communications
- **Deployment**: Docker Compose based

## Quick Start (5 minutes)

```bash
cd fabric-network
chmod +x scripts/*.sh
./scripts/network-setup.sh
docker-compose up -d
./scripts/deploy-channel.sh
./scripts/deploy-chaincode.sh
```

## Chaincode Functions

The Product Ledger chaincode (`chaincode/productledger.go`) implements:

### Required Functions
- ✅ `CreateMegaQR(requestJSON)` - Create product batch
- ✅ `CreateChildQR(megaID, childID)` - Create single child QR
- ✅ `UpdateProductStatus(productID, newStatus)` - Update status
- ✅ `RecordScanEvent(productID, requestJSON)` - Record scan
- ✅ `VerifyProduct(productID)` - Verify authenticity
- ✅ `GetProductHistory(productID)` - Get complete history

### Security Features
- **Immutability**: All transactions are immutable once committed
- **Duplicate Prevention**: Prevents duplicate QR code creation
- **Hash Integrity**: Validates hash integrity for verification

## Integration with Backend

Update your backend `.env`:

```env
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_CONNECTION_PROFILE=./fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true
```

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

## Testing

### Sample Invoke Command
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

### Sample Query Command
```bash
docker exec cli peer chaincode query \
  -C productledger-channel \
  -n productledger \
  -c '{"function":"GetMegaQR","Args":["MEGA-1234567890-ABC12345"]}'
```

## Troubleshooting

See [`fabric-network/DEPLOYMENT.md`](fabric-network/DEPLOYMENT.md) for detailed troubleshooting steps.

## Production Considerations

For production deployment:
1. Use production-grade certificates (not cryptogen)
2. Increase Raft orderer nodes (minimum 3)
3. Add more peers per organization
4. Configure proper network policies
5. Set up monitoring and alerting
6. Implement backup strategies

See [`fabric-network/README.md`](fabric-network/README.md) for production checklist.

