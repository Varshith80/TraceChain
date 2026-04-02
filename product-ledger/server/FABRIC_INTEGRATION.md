# Hyperledger Fabric Integration Guide

This document describes the Hyperledger Fabric Gateway SDK integration in the Product Ledger backend.

## Architecture

### Connection Management
- **Singleton Pattern**: Gateway and Network instances are reused across requests
- **Connection Reuse**: Single connection pool for optimal performance
- **Secure Identity**: Certificate-based or wallet-based identity management

### Data Flow
1. **Write Operations**: Backend → Fabric Blockchain (source of truth)
2. **Event Sync**: Fabric Events → PostgreSQL Read Mirror (one-way)
3. **Read Operations**: PostgreSQL Read Mirror (fast) or Fabric (authoritative)

## Configuration

### Environment Variables

```env
# Fabric Network Configuration
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_CONNECTION_PROFILE=./fabric-network/connection-profile.json

# Identity Management (choose one method)
# Method 1: Wallet-based (development)
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true

# Method 2: Certificate-based (production)
FABRIC_CERT_PATH=./crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem
FABRIC_KEY_PATH=./crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/key.pem
FABRIC_MSP_ID=Org1MSP

# TLS Configuration
FABRIC_TLS_ENABLED=true
FABRIC_TLS_CA_CERT=<certificate content>

# Event Listener
FABRIC_ENABLE_EVENT_LISTENER=true
```

## Identity Management

### Wallet-Based (Development)
Uses Fabric wallet to store identities. Suitable for development and testing.

```bash
# Enroll user identity (run once)
# This requires Fabric CA or manual certificate generation
```

### Certificate-Based (Production)
Uses direct certificate and key files. More secure for production.

```env
FABRIC_CERT_PATH=/path/to/cert.pem
FABRIC_KEY_PATH=/path/to/key.pem
FABRIC_MSP_ID=Org1MSP
```

## Read Mirror Tables

PostgreSQL tables that mirror blockchain data for fast reads:

### `mega_qrs_read`
- Mirrors MegaQR data from blockchain
- Optimized for read queries
- Synced via event listeners

### `child_qrs_read`
- Mirrors ChildQR data from blockchain
- Optimized for read queries
- Synced via event listeners

### `scan_events_read`
- Mirrors scan events from blockchain
- Separate table for analytics
- Synced via event listeners

**Important**: These tables are read-only mirrors. Fabric blockchain is the source of truth.

## Event Listener

The event listener automatically syncs blockchain data to PostgreSQL:

### Features
- Listens to Fabric chaincode events
- Syncs MegaQR, ChildQR, and ScanEvent updates
- Non-blocking sync (doesn't affect blockchain operations)
- Handles errors gracefully

### Starting/Stopping
```typescript
import { startEventListener, stopEventListener } from './fabric/event-listener.js';

// Start (automatic on server startup)
await startEventListener();

// Stop (automatic on graceful shutdown)
await stopEventListener();
```

### Manual Sync
```typescript
import { syncProductToRead, syncManufacturerProducts } from './fabric/event-listener.js';

// Sync single product
await syncProductToRead('MEGA-1234567890-ABC12345');

// Sync all products for manufacturer
await syncManufacturerProducts('Org1MSP');
```

## Repository Functions

### New Chaincode Functions
- `CreateMegaQR` - Create product batch
- `CreateChildQR` - Create single child QR
- `UpdateProductStatus` - Update product status
- `RecordScanEvent` - Record scan event
- `VerifyProduct` - Verify product authenticity
- `GetProductHistory` - Get complete product history

### Usage Example
```typescript
import { getProductRepository } from './fabric/repository.js';

const repo = getProductRepository();

// Create MegaQR
const result = await repo.createMegaQR(request, manufacturerID, manufacturerName);

// Update status
await repo.updateProductStatus(productID, 'recalled');

// Record scan
await repo.recordScanEvent(productID, { location: 'Warehouse A' });

// Get history
const history = await repo.getProductHistory(productID);
```

## Read Mirror Queries

Fast read queries from PostgreSQL mirror:

```typescript
import {
  getMegaQRFromRead,
  getChildQRFromRead,
  getManufacturerMegaQRsFromRead,
  getScanEventsFromRead,
  getAnalyticsFromRead,
} from './database/read-mirror.js';

// Fast reads from mirror
const megaQR = await getMegaQRFromRead(megaID);
const scanEvents = await getScanEventsFromRead(productID);
const analytics = await getAnalyticsFromRead();
```

## Error Handling

All Fabric operations include proper error handling:
- Connection errors are logged and retried
- Transaction errors are propagated to caller
- Read mirror sync errors are non-critical (logged only)

## Performance Considerations

1. **Connection Reuse**: Gateway connection is reused across requests
2. **Read Mirror**: Fast reads from PostgreSQL instead of blockchain
3. **Event Listener**: Async sync doesn't block blockchain operations
4. **Caching**: Legacy cache tables still available for backward compatibility

## Troubleshooting

### Connection Issues
```bash
# Check Fabric network is running
docker-compose -f fabric-network/docker-compose.yaml ps

# Check certificates
ls -la $FABRIC_CERT_PATH
ls -la $FABRIC_KEY_PATH

# Check connection profile
cat $FABRIC_CONNECTION_PROFILE
```

### Event Listener Issues
```bash
# Check event listener is running
# Look for "Fabric event listener started" in logs

# Manual sync if needed
# Use syncProductToRead() function
```

### Read Mirror Sync Issues
```bash
# Check PostgreSQL tables
psql -d product_ledger_users -c "SELECT COUNT(*) FROM mega_qrs_read;"
psql -d product_ledger_users -c "SELECT COUNT(*) FROM scan_events_read;"

# Check sync timestamps
psql -d product_ledger_users -c "SELECT mega_id, synced_at FROM mega_qrs_read ORDER BY synced_at DESC LIMIT 10;"
```

## Security Best Practices

1. **Certificate Management**: Store certificates securely, use environment variables
2. **TLS**: Always enable TLS in production
3. **Identity Isolation**: Use separate identities for different operations
4. **Access Control**: Implement proper access control at application level
5. **Audit Logging**: All blockchain operations are logged

## Production Checklist

- [ ] Use certificate-based identity (not wallet)
- [ ] Enable TLS
- [ ] Configure proper connection profile
- [ ] Set up event listener
- [ ] Monitor read mirror sync
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerting
- [ ] Test failover scenarios

