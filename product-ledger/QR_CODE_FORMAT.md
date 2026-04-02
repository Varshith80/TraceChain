# QR Code Format Update

## Overview

QR codes now use a URL-based format instead of embedding sensitive data.

## New Format

**Old Format**: `childID:hash` (e.g., `MEGA-123-C00001:a1b2c3d4...`)
**New Format**: `https://verify.<domain>/v/{childID}` (e.g., `https://verify.productledger.com/v/MEGA-123-C00001`)

## Benefits

1. **No Sensitive Data**: Only childID is embedded, hash is verified server-side
2. **URL-Based**: Standard QR code scanners can open directly in browser
3. **Domain-Based**: Can use dedicated verification domain
4. **Downloadable**: QR codes are still downloadable as PNG images
5. **Secure**: Hash verification happens server-side on blockchain

## Configuration

### Frontend Environment Variables

```env
# Verification domain (production)
VITE_VERIFY_DOMAIN=verify.productledger.com
VITE_VERIFY_PROTOCOL=https

# Development (uses API URL as fallback)
VITE_API_URL=http://localhost:3001/api
```

### Backend

The public verification endpoint is automatically available at:
- `GET /v/:childID` - Public verification (no authentication)

## Implementation

### QR Code Generation

QR codes are generated in:
- `src/components/manufacturer/QRCodeGrid.tsx`
- `src/components/manufacturer/ChildQRDetailsSheet.tsx`
- `src/components/manufacturer/ParentQROverview.tsx`

All use `getVerificationURL(childID)` which returns:
```
https://verify.<domain>/v/{childID}
```

### Public Verification Endpoint

**Route**: `GET /v/:childID`

**Flow**:
1. Fetch product data from Hyperledger Fabric (source of truth)
2. Verify hash integrity on blockchain
3. Fetch read-only metadata from PostgreSQL mirror (fast)
4. Return authenticity result

**Response**:
```json
{
  "valid": true,
  "hashMatch": true,
  "message": "Product is authentic",
  "childID": "MEGA-123-C00001",
  "timestamp": "2024-01-01T00:00:00Z",
  "responseTime": 150,
  "product": {
    "childID": "MEGA-123-C00001",
    "childHash": "...",
    "megaID": "MEGA-123",
    "status": "active",
    "productSnapshot": {...},
    "scanCount": 5,
    "lastScanned": "2024-01-01T00:00:00Z",
    "committedMessagesCount": 3
  },
  "parent": {
    "megaID": "MEGA-123",
    "product": "Product Name",
    "batchNo": "BATCH001",
    "manufacturerName": "Manufacturer",
    "status": "active"
  },
  "recentScans": [...]
}
```

## Security

- **No Authentication Required**: Public endpoint for consumer verification
- **Hash Verification**: Hash integrity verified on blockchain
- **Read-Only Metadata**: PostgreSQL mirror provides fast reads without exposing sensitive data
- **Error Handling**: Errors don't expose internal details

## Testing

### Test QR Code Generation
```bash
# Generate a ChildQR
# Check QR code contains: https://verify.productledger.com/v/{childID}
```

### Test Public Verification
```bash
# Direct API call
curl https://verify.productledger.com/v/MEGA-123-C00001

# Or via browser
https://verify.productledger.com/v/MEGA-123-C00001
```

### Test Download
1. Generate QR code in manufacturer dashboard
2. Click download button
3. Verify PNG image is downloaded
4. Scan downloaded QR code
5. Verify it opens verification page

## Migration Notes

- Old QR codes with `childID:hash` format will not work
- New QR codes must be generated for existing products
- Frontend automatically uses new format
- Backend supports both old authenticated endpoint and new public endpoint

## Production Deployment

1. Set `VITE_VERIFY_DOMAIN` to your verification domain
2. Configure DNS for `verify.<your-domain>`
3. Set up SSL certificate for verification domain
4. Update QR codes for existing products if needed

