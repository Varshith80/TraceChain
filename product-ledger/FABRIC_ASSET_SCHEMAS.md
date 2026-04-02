# Hyperledger Fabric Asset Schemas

## Canonical Data Models for Blockchain

This document defines the canonical, blockchain-friendly data models for Product Ledger. All models are deterministic and contain NO user authentication fields (auth is centralized in PostgreSQL).

---

## 1. MegaQR (Batch-Level Product)

### TypeScript Interface
```typescript
interface MegaQR {
  objectType: 'MegaQR';           // Required for Fabric queries
  megaID: string;                 // Unique batch identifier
  megaHash: string;               // SHA-256 hash (deterministic)
  product: string;                // Product name
  batchNo: string;                // Batch number
  mfgDate: string;                // ISO 8601 date (YYYY-MM-DD)
  expiryDate: string;             // ISO 8601 date (YYYY-MM-DD)
  manufacturerID: string;         // Blockchain actor ID (from Fabric MSP)
  manufacturerName?: string;     // Display name (optional)
  childList: string[];           // Array of ChildQR IDs
  committedMessages: CommittedMessage[]; // Immutable message log
  meta: MegaQRMeta;              // Metadata
  version: string;                // Schema version (e.g., "1.0")
  status: 'active' | 'recalled' | 'expired';
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Go Struct (Chaincode)
```go
type MegaQR struct {
    ObjectType        string            `json:"objectType"`
    MegaID            string            `json:"megaID"`
    MegaHash          string            `json:"megaHash"`
    Product           string            `json:"product"`
    BatchNo           string            `json:"batchNo"`
    MfgDate           string            `json:"mfgDate"`        // ISO 8601
    ExpiryDate        string            `json:"expiryDate"`      // ISO 8601
    ManufacturerID    string            `json:"manufacturerID"`   // Blockchain actor
    ManufacturerName  string            `json:"manufacturerName,omitempty"`
    ChildList         []string          `json:"childList"`
    CommittedMessages []CommittedMessage `json:"committedMessages"`
    Meta              map[string]interface{} `json:"meta"`
    Version           string            `json:"version"`
    Status            string            `json:"status"`           // active|recalled|expired
    CreatedAt         string            `json:"createdAt"`       // ISO 8601
    UpdatedAt         string            `json:"updatedAt"`       // ISO 8601
}
```

### Deterministic Fields
- All string fields are deterministic (no random values)
- Timestamps use ISO 8601 format for consistency
- Hashes are SHA-256 (deterministic)
- Status is enum (deterministic)

### Blockchain Storage
- Stored as Fabric asset with key = `megaID`
- Queryable by `objectType`, `manufacturerID`, `status`
- Immutable: `committedMessages` can only be appended

---

## 2. ChildQR (Unit-Level Product)

### TypeScript Interface
```typescript
interface ChildQR {
  objectType: 'ChildQR';          // Required for Fabric queries
  childID: string;                // Unique unit identifier
  childHash: string;              // SHA-256 hash (deterministic)
  megaID: string;                 // Parent MegaQR ID
  megaHash: string;               // Parent MegaQR hash (for verification)
  productSnapshot: ProductSnapshot; // Immutable snapshot at creation
  committedMessages: CommittedMessage[]; // Immutable message log
  scanEvents: ScanEvent[];        // Immutable scan log
  status: 'active' | 'sold' | 'recalled' | 'returned';
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Go Struct (Chaincode)
```go
type ChildQR struct {
    ObjectType        string            `json:"objectType"`
    ChildID           string            `json:"childID"`
    ChildHash         string            `json:"childHash"`
    MegaID            string            `json:"megaID"`
    MegaHash          string            `json:"megaHash"`
    ProductSnapshot   ProductSnapshot   `json:"productSnapshot"`
    CommittedMessages []CommittedMessage `json:"committedMessages"`
    ScanEvents        []ScanEvent       `json:"scanEvents"`
    Status            string            `json:"status"`           // active|sold|recalled|returned
    CreatedAt         string            `json:"createdAt"`       // ISO 8601
    UpdatedAt         string            `json:"updatedAt"`        // ISO 8601
}
```

### ProductSnapshot
```typescript
interface ProductSnapshot {
  product: string;
  batchNo: string;
  mfgDate: string;                // ISO 8601 date
  expiryDate: string;              // ISO 8601 date
  manufacturerID: string;          // Blockchain actor ID
  manufacturerName?: string;
}
```

### Deterministic Fields
- All fields are deterministic
- `productSnapshot` is immutable (captured at creation)
- Hash verification uses deterministic algorithm

---

## 3. ScanEvent

### TypeScript Interface
```typescript
interface ScanEvent {
  childID?: string;               // ChildQR ID (if scanning unit)
  megaID?: string;                 // MegaQR ID (if scanning batch)
  actorID: string;                 // Blockchain actor ID (from Fabric MSP)
  ts: string;                     // ISO 8601 timestamp
  location?: string;              // Optional geographic location
  device?: string;                // Optional device identifier
  txHash?: string;                // Transaction hash (set by blockchain)
}
```

### Go Struct (Chaincode)
```go
type ScanEvent struct {
    ChildID  string `json:"childID,omitempty"`
    MegaID   string `json:"megaID,omitempty"`
    ActorID  string `json:"actorID"`              // Blockchain actor
    Ts       string `json:"ts"`                   // ISO 8601
    Location string `json:"location,omitempty"`
    Device   string `json:"device,omitempty"`
    TxHash   string `json:"txHash,omitempty"`     // Set by blockchain
}
```

### Architecture Notes
- **NO user authentication fields** - uses `actorID` (blockchain identity)
- Immutable - once logged, cannot be modified
- Stored in `ChildQR.scanEvents` array (append-only)
- Timestamp is deterministic (ISO 8601)

---

## 4. CommittedMessage (Immutable Audit Entry)

### TypeScript Interface
```typescript
interface CommittedMessage {
  msg: string;                    // Message content (deterministic)
  actorID: string;                // Blockchain actor ID (from Fabric MSP)
  ts: string;                     // ISO 8601 timestamp (deterministic)
  location?: string;              // Optional geographic location
  device?: string;                // Optional device identifier
  txHash?: string;                // Transaction hash (set by blockchain)
}
```

### Go Struct (Chaincode)
```go
type CommittedMessage struct {
    Msg      string `json:"msg"`
    ActorID  string `json:"actorID"`              // Blockchain actor
    Ts       string `json:"ts"`                  // ISO 8601
    Location string `json:"location,omitempty"`
    Device   string `json:"device,omitempty"`
    TxHash   string `json:"txHash,omitempty"`     // Set by blockchain
}
```

### Architecture Notes
- **NO user authentication fields** - uses `actorID` (blockchain identity)
- Immutable - once committed, cannot be modified
- Stored in both `MegaQR.committedMessages` and `ChildQR.committedMessages`
- Timestamp is deterministic (ISO 8601)
- Transaction hash links to blockchain transaction

---

## Key Architecture Principles

### 1. Deterministic Models
- All fields use deterministic formats (ISO 8601 dates/timestamps)
- No random values in data models
- Hashes are SHA-256 (deterministic algorithm)
- Enums are fixed sets of values

### 2. No User Authentication Fields
- **NO** `userID`, `userEmail`, `userRole` in blockchain models
- Uses `actorID` (blockchain identity from Fabric MSP)
- User authentication is centralized in PostgreSQL
- Mapping between users and actors handled by `actor-mapping.ts`

### 3. Immutability
- `committedMessages` arrays are append-only
- `scanEvents` arrays are append-only
- `productSnapshot` is immutable (captured at creation)
- Status changes are tracked via `updatedAt` timestamp

### 4. Blockchain-Friendly
- All data is JSON-serializable
- String-based IDs and hashes (blockchain compatible)
- ISO 8601 timestamps for cross-platform compatibility
- `objectType` field enables Fabric CouchDB queries

### 5. Verification
- Hash verification: `childHash` must match `megaHash` pattern
- Status verification: check for recalls/expiration
- Timestamp verification: ensure chronological order

---

## Migration Notes

### Breaking Changes from Previous Models

1. **CommittedMessage.by → CommittedMessage.actorID**
   - Old: `by: string` (user ID)
   - New: `actorID: string` (blockchain identity)
   - Migration: Map user IDs to actor IDs via `actor-mapping.ts`

2. **ScanLog → ScanEvent**
   - Old: `ScanLog` with `role` field (user auth)
   - New: `ScanEvent` with `actorID` (blockchain identity)
   - Migration: Remove `role` field, use `actorID`

3. **ChildQR.scanLogs → ChildQR.scanEvents**
   - Old: `scanLogs: ScanLog[]`
   - New: `scanEvents: ScanEvent[]`
   - Migration: Rename field, update type

### Compatibility
- Legacy type aliases provided: `type ScanLog = ScanEvent`
- Frontend can gradually migrate to new field names
- Backend uses canonical models exclusively

---

## Example JSON (Blockchain Asset)

### MegaQR Example
```json
{
  "objectType": "MegaQR",
  "megaID": "MEGA-1735567890-ABC12345",
  "megaHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "product": "Organic Honey 500g",
  "batchNo": "B2025-001",
  "mfgDate": "2025-01-01",
  "expiryDate": "2027-01-01",
  "manufacturerID": "manufacturer-550e8400-e29b-41d4-a716-446655440000",
  "manufacturerName": "Golden Bee Farms",
  "childList": ["MEGA-1735567890-ABC12345-C00001", "MEGA-1735567890-ABC12345-C00002"],
  "committedMessages": [
    {
      "msg": "Manufactured",
      "actorID": "manufacturer-550e8400-e29b-41d4-a716-446655440000",
      "ts": "2025-01-01T10:00:00Z",
      "txHash": "tx-abc123..."
    }
  ],
  "meta": {
    "notes": "Premium organic honey",
    "certs": ["USDA-ORG-2025"]
  },
  "version": "1.0",
  "status": "active",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

### ChildQR Example
```json
{
  "objectType": "ChildQR",
  "childID": "MEGA-1735567890-ABC12345-C00001",
  "childHash": "c3d4e5f67890123456789012345678901234def1234567890abcdef12345678",
  "megaID": "MEGA-1735567890-ABC12345",
  "megaHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "productSnapshot": {
    "product": "Organic Honey 500g",
    "batchNo": "B2025-001",
    "mfgDate": "2025-01-01",
    "expiryDate": "2027-01-01",
    "manufacturerID": "manufacturer-550e8400-e29b-41d4-a716-446655440000",
    "manufacturerName": "Golden Bee Farms"
  },
  "committedMessages": [],
  "scanEvents": [],
  "status": "active",
  "createdAt": "2025-01-01T10:05:00Z",
  "updatedAt": "2025-01-01T10:05:00Z"
}
```

---

## Validation Rules

### MegaQR
- `megaID` must be unique
- `mfgDate` must be before `expiryDate`
- `status` must be one of: `active`, `recalled`, `expired`
- `version` must match schema version

### ChildQR
- `childID` must be unique
- `megaID` must reference existing MegaQR
- `childHash` must be verifiable against `megaHash`
- `status` must be one of: `active`, `sold`, `recalled`, `returned`

### CommittedMessage
- `msg` cannot be empty
- `actorID` must be valid blockchain identity
- `ts` must be valid ISO 8601 timestamp
- Cannot be modified after creation

### ScanEvent
- Must have either `childID` or `megaID` (not both, not neither)
- `actorID` must be valid blockchain identity
- `ts` must be valid ISO 8601 timestamp
- Cannot be modified after creation

---

*Last Updated: Based on canonical model definitions*

