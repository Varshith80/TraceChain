# Hyperledger Fabric Network Setup

This directory contains a production-ready Hyperledger Fabric network configuration for the Product Ledger application.

## Network Architecture

- **2 Organizations**: Org1 and Org2
- **1 Channel**: `productledger-channel`
- **Ordering Service**: Raft (etcdraft) with 1 orderer node
- **State Database**: CouchDB (enabled for rich queries)
- **TLS**: Enabled for all communications
- **Deployment**: Docker Compose based

## Prerequisites

1. **Docker** (version 20.10+)
2. **Docker Compose** (version 1.29+)
3. **Hyperledger Fabric Binaries** (optional, for local crypto generation)
   - Download from: https://github.com/hyperledger/fabric/releases
   - Extract and add `bin/` to your PATH

## Quick Start

### 1. Generate Crypto Material and Channel Artifacts

```bash
cd fabric-network
chmod +x scripts/*.sh
./scripts/network-setup.sh
```

This script will:
- Generate cryptographic material for all organizations
- Create the genesis block
- Generate channel creation transaction
- Generate anchor peer transactions

### 2. Start the Network

```bash
docker-compose up -d
```

Wait for all containers to be healthy (about 30 seconds).

### 3. Create and Join Channel

```bash
./scripts/deploy-channel.sh
```

This will:
- Create the `productledger-channel`
- Join both organizations to the channel
- Update anchor peers

### 4. Deploy Chaincode

```bash
./scripts/deploy-chaincode.sh
```

This will:
- Package the chaincode
- Install on both peers
- Approve for both organizations
- Commit the chaincode definition

### 5. Test Chaincode

```bash
./scripts/test-chaincode.sh
```

## Network Components

### Orderer
- **Container**: `orderer.example.com`
- **Port**: 7050 (gRPC)
- **Type**: Raft (etcdraft)

### Organization 1 (Org1)
- **Peer**: `peer0.org1.example.com`
  - **Port**: 7051 (gRPC), 9443 (Operations)
- **CouchDB**: `couchdb0`
  - **Port**: 5984
- **MSP ID**: `Org1MSP`

### Organization 2 (Org2)
- **Peer**: `peer0.org2.example.com`
  - **Port**: 9051 (gRPC), 9444 (Operations)
- **CouchDB**: `couchdb1`
  - **Port**: 6984 (mapped from 5984)
- **MSP ID**: `Org2MSP`

### CLI Tool
- **Container**: `cli`
- Used for network operations and chaincode deployment

## Directory Structure

```
fabric-network/
├── docker-compose.yaml      # Network services definition
├── configtx.yaml            # Channel configuration
├── crypto-config.yaml       # Crypto material generation config
├── connection-profile.json  # Connection profile for SDK
├── scripts/
│   ├── network-setup.sh     # Initial network setup
│   ├── generate-crypto.sh   # Generate crypto material
│   ├── generate-genesis.sh  # Generate genesis block
│   ├── create-channel.sh   # Create channel transaction
│   ├── generate-anchor-peers.sh # Generate anchor peer transactions
│   ├── deploy-channel.sh    # Deploy channel to network
│   ├── deploy-chaincode.sh  # Deploy chaincode
│   └── test-chaincode.sh    # Test chaincode functions
├── crypto-config/           # Generated crypto material (gitignored)
└── channel-artifacts/       # Generated channel artifacts (gitignored)
```

## Chaincode Functions

The Product Ledger chaincode provides the following functions:

### Core Functions
- `CreateMegaQR(requestJSON)` - Create a new product batch
- `CreateChildQR(megaID, childID)` - Create a single child QR code
- `UpdateProductStatus(productID, newStatus)` - Update product status
- `RecordScanEvent(productID, requestJSON)` - Record a scan event
- `VerifyProduct(productID)` - Verify product authenticity
- `GetProductHistory(productID)` - Get complete product history

### Query Functions
- `GetMegaQR(megaID)` - Get MegaQR by ID
- `GetChildQR(childID)` - Get ChildQR by ID
- `GetManufacturerMegaQRs(manufacturerID)` - Get all MegaQRs for a manufacturer
- `GetChildrenByMegaID(megaID)` - Get all children for a MegaQR

### Security Features
- **Immutability**: All transactions are immutable once committed
- **Duplicate Prevention**: Prevents duplicate QR code creation
- **Hash Integrity**: Validates hash integrity for product verification

## Sample Commands

### Create a MegaQR
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

### Query a MegaQR
```bash
docker exec cli peer chaincode query \
  -C productledger-channel \
  -n productledger \
  -c '{"function":"GetMegaQR","Args":["MEGA-1234567890-ABC12345"]}'
```

### Create a ChildQR
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
  -c '{"function":"CreateChildQR","Args":["MEGA-1234567890-ABC12345","MEGA-1234567890-ABC12345-C00001"]}'
```

### Verify a Product
```bash
docker exec cli peer chaincode query \
  -C productledger-channel \
  -n productledger \
  -c '{"function":"VerifyProduct","Args":["MEGA-1234567890-ABC12345-C00001"]}'
```

### Get Product History
```bash
docker exec cli peer chaincode query \
  -C productledger-channel \
  -n productledger \
  -c '{"function":"GetProductHistory","Args":["MEGA-1234567890-ABC12345-C00001"]}'
```

## Stopping the Network

```bash
docker-compose down
```

To remove all volumes and start fresh:
```bash
docker-compose down -v
```

## Troubleshooting

### Check container logs
```bash
docker-compose logs -f [service-name]
```

### Check peer status
```bash
docker exec cli peer node status
```

### Check channel info
```bash
docker exec cli peer channel getinfo -c productledger-channel
```

### Check chaincode list
```bash
docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel
```

## Integration with Backend

Update your backend `.env` file:

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

## Production Considerations

For production deployment:

1. **Increase Raft orderer nodes** (minimum 3 for fault tolerance)
2. **Add more peers** per organization for redundancy
3. **Use external CAs** instead of cryptogen
4. **Configure proper TLS certificates** from trusted CAs
5. **Set up monitoring** (Prometheus, Grafana)
6. **Implement backup strategies** for ledger data
7. **Configure network policies** for access control
8. **Use Kubernetes** for orchestration instead of Docker Compose

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Samples](https://github.com/hyperledger/fabric-samples)

