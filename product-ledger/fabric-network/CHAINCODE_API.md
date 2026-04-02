# Product Ledger Chaincode API Reference

Complete API reference for the Product Ledger chaincode functions.

## Function Overview

| Function | Type | Description |
|----------|------|-------------|
| `CreateMegaQR` | Invoke | Create a new product batch (MegaQR) |
| `CreateChildQR` | Invoke | Create a single child QR code |
| `UpdateProductStatus` | Invoke | Update product status |
| `RecordScanEvent` | Invoke | Record a scan event |
| `VerifyProduct` | Query | Verify product authenticity |
| `GetProductHistory` | Query | Get complete product history |

## Function Details

### CreateMegaQR

Creates a new MegaQR (product batch) with immutability and duplicate prevention.

**Function Signature:**
```go
CreateMegaQR(ctx, requestJSON string) (*MegaQR, error)
```

**Parameters:**
- `requestJSON` (string): JSON string containing:
  ```json
  {
    "product": "Product Name",
    "batchNo": "BATCH001",
    "mfgDate": "2024-01-01",
    "expiryDate": "2025-01-01",
    "manufacturerName": "Manufacturer Name",
    "meta": {} // optional
  }
  ```

**Returns:**
- `MegaQR` object with generated `megaID` and `megaHash`

**Example:**
```bash
peer chaincode invoke -c '{"function":"CreateMegaQR","Args":["{\"product\":\"Test Product\",\"batchNo\":\"BATCH001\",\"mfgDate\":\"2024-01-01\",\"expiryDate\":\"2025-01-01\",\"manufacturerName\":\"Test Manufacturer\"}"]}'
```

**Security:**
- Prevents duplicate creation
- Generates unique hash
- Immutable once created

---

### CreateChildQR

Creates a single child QR code for a MegaQR with hash integrity validation.

**Function Signature:**
```go
CreateChildQR(ctx, megaID string, childID string) (*ChildQR, error)
```

**Parameters:**
- `megaID` (string): Parent MegaQR ID
- `childID` (string): Child QR ID (e.g., "MEGA-123-C00001")

**Returns:**
- `ChildQR` object with validated hash

**Example:**
```bash
peer chaincode invoke -c '{"function":"CreateChildQR","Args":["MEGA-1234567890-ABC12345","MEGA-1234567890-ABC12345-C00001"]}'
```

**Security:**
- Prevents duplicate creation
- Validates hash integrity against parent
- Immutable once created

---

### UpdateProductStatus

Updates the status of a product (MegaQR or ChildQR) with history tracking.

**Function Signature:**
```go
UpdateProductStatus(ctx, productID string, newStatus string) (map[string]interface{}, error)
```

**Parameters:**
- `productID` (string): MegaQR or ChildQR ID
- `newStatus` (string): New status (e.g., "active", "recalled", "sold")

**Returns:**
- Status update result with old and new status

**Example:**
```bash
peer chaincode invoke -c '{"function":"UpdateProductStatus","Args":["MEGA-1234567890-ABC12345-C00001","recalled"]}'
```

**Security:**
- Appends status change to history
- Immutable history record

---

### RecordScanEvent

Records an immutable scan event for a product.

**Function Signature:**
```go
RecordScanEvent(ctx, productID string, requestJSON string) (map[string]interface{}, error)
```

**Parameters:**
- `productID` (string): MegaQR or ChildQR ID
- `requestJSON` (string): JSON string containing:
  ```json
  {
    "location": "Location Name",
    "device": "Device ID"
  }
  ```

**Returns:**
- Scan event record with transaction hash

**Example:**
```bash
peer chaincode invoke -c '{"function":"RecordScanEvent","Args":["MEGA-1234567890-ABC12345-C00001","{\"location\":\"Warehouse A\",\"device\":\"SCANNER001\"}"]}'
```

**Security:**
- Immutable event recording
- Includes transaction hash
- Timestamped

---

### VerifyProduct

Verifies product authenticity by checking hash integrity and status.

**Function Signature:**
```go
VerifyProduct(ctx, productID string) (map[string]interface{}, error)
```

**Parameters:**
- `productID` (string): ChildQR ID to verify

**Returns:**
- Verification result:
  ```json
  {
    "valid": true/false,
    "hashMatch": true/false,
    "message": "Verification message",
    "childQR": {...},
    "megaQR": {...}
  }
  ```

**Example:**
```bash
peer chaincode query -c '{"function":"VerifyProduct","Args":["MEGA-1234567890-ABC12345-C00001"]}'
```

**Security:**
- Validates hash integrity
- Checks for recalls
- Returns complete verification details

---

### GetProductHistory

Retrieves complete history of a product including all events and messages.

**Function Signature:**
```go
GetProductHistory(ctx, productID string) (map[string]interface{}, error)
```

**Parameters:**
- `productID` (string): MegaQR or ChildQR ID

**Returns:**
- Complete product history:
  ```json
  {
    "productID": "...",
    "productType": "ChildQR" | "MegaQR",
    "committedMessages": [...],
    "scanEvents": [...],
    "history": {
      "createdAt": "...",
      "updatedAt": "...",
      "status": "..."
    }
  }
  ```

**Example:**
```bash
peer chaincode query -c '{"function":"GetProductHistory","Args":["MEGA-1234567890-ABC12345-C00001"]}'
```

**Security:**
- Returns immutable history
- Includes all events and messages

---

## Additional Query Functions

### GetMegaQR
```go
GetMegaQR(ctx, megaID string) (*MegaQR, error)
```

### GetChildQR
```go
GetChildQR(ctx, childID string) (*ChildQR, error)
```

### GetManufacturerMegaQRs
```go
GetManufacturerMegaQRs(ctx, manufacturerID string) ([]*MegaQR, error)
```

### GetChildrenByMegaID
```go
GetChildrenByMegaID(ctx, megaID string) ([]*ChildQR, error)
```

## Security Features

### Immutability
- All transactions are immutable once committed to the ledger
- History cannot be modified or deleted

### Duplicate Prevention
- `CreateMegaQR` and `CreateChildQR` check for existing records
- Prevents duplicate QR code creation

### Hash Integrity
- All QR codes have cryptographic hashes
- `VerifyProduct` validates hash integrity
- ChildQR hashes are derived from parent MegaQR

### Status Tracking
- Status changes are recorded in history
- Cannot be modified, only appended

## Error Handling

All functions return descriptive errors:
- `"product not found"` - Product ID doesn't exist
- `"duplicate creation prevented"` - QR already exists
- `"hash integrity validation failed"` - Hash mismatch
- `"parent MegaQR not found"` - Parent doesn't exist

## Best Practices

1. **Always verify** products before accepting them
2. **Record scan events** for audit trail
3. **Update status** when product state changes
4. **Use GetProductHistory** for complete traceability
5. **Handle errors** appropriately in client applications

## Testing

See `fabric-network/scripts/test-chaincode.sh` for example test commands.

