/**
 * Canonical Data Models for Blockchain
 * 
 * Architecture Rules:
 * - Models are blockchain-friendly and deterministic
 * - NO user authentication fields (auth is centralized in PostgreSQL)
 * - All timestamps use ISO 8601 format for determinism
 * - All IDs and hashes are strings for blockchain compatibility
 */

/**
 * CommittedMessage - Immutable audit entry on blockchain
 * Architecture: No user auth fields - uses actorID (blockchain identity)
 */
export interface CommittedMessage {
  // Core message data
  msg: string;                    // Message content (deterministic)
  actorID: string;                // Blockchain actor ID (from Fabric MSP, NOT user auth)
  ts: string;                     // ISO 8601 timestamp (deterministic)
  
  // Optional context (deterministic)
  location?: string;               // Geographic location (optional)
  device?: string;                 // Device identifier (optional)
  txHash?: string;                 // Transaction hash (set by blockchain)
}

/**
 * ScanEvent - Product scan event on blockchain
 * Architecture: Immutable audit trail, no user auth fields
 */
export interface ScanEvent {
  // Target identification
  childID?: string;                // ChildQR ID (if scanning individual unit)
  megaID?: string;                 // MegaQR ID (if scanning batch)
  
  // Event data (deterministic)
  actorID: string;                 // Blockchain actor ID (from Fabric MSP)
  ts: string;                      // ISO 8601 timestamp (deterministic)
  
  // Optional context (deterministic)
  location?: string;               // Geographic location
  device?: string;                 // Device identifier
  txHash?: string;                 // Transaction hash (set by blockchain)
}

/**
 * MegaQRMeta - Metadata for MegaQR (deterministic)
 */
export interface MegaQRMeta {
  notes?: string;                 // Free-form notes
  certs?: string[];                // Certificate IDs/URLs
  customFields?: Record<string, string>; // Custom key-value pairs (all strings for determinism)
}

/**
 * MegaQR - Batch-level product on blockchain
 * Architecture: Blockchain asset, deterministic, no user auth
 */
export interface MegaQR {
  // Object type identifier (required for Fabric queries)
  objectType: 'MegaQR';
  
  // Identity (deterministic)
  megaID: string;                  // Unique batch identifier
  megaHash: string;                // SHA-256 hash (deterministic)
  
  // Product information (deterministic)
  product: string;                 // Product name
  batchNo: string;                 // Batch number
  mfgDate: string;                 // ISO 8601 date (YYYY-MM-DD)
  expiryDate: string;              // ISO 8601 date (YYYY-MM-DD)
  
  // Manufacturer (blockchain identity, NOT user auth)
  manufacturerID: string;           // Blockchain actor ID (from Fabric MSP)
  manufacturerName?: string;        // Display name (optional)
  
  // Relationships
  childList: string[];             // Array of ChildQR IDs
  
  // Immutable audit trail
  committedMessages: CommittedMessage[]; // Immutable message log
  
  // Metadata (deterministic)
  meta: MegaQRMeta;
  version: string;                  // Schema version (e.g., "1.0")
  
  // Status (deterministic enum)
  status: 'active' | 'recalled' | 'expired';
  
  // Timestamps (ISO 8601, deterministic)
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}

/**
 * ProductSnapshot - Snapshot of product data at ChildQR creation
 * Architecture: Immutable snapshot, deterministic
 */
export interface ProductSnapshot {
  product: string;                 // Product name
  batchNo: string;                 // Batch number
  mfgDate: string;                 // ISO 8601 date (YYYY-MM-DD)
  expiryDate: string;              // ISO 8601 date (YYYY-MM-DD)
  manufacturerID: string;           // Blockchain actor ID
  manufacturerName?: string;        // Display name (optional)
}

/**
 * ChildQR - Unit-level product on blockchain
 * Architecture: Blockchain asset, deterministic, no user auth
 */
export interface ChildQR {
  // Object type identifier (required for Fabric queries)
  objectType: 'ChildQR';
  
  // Identity (deterministic)
  childID: string;                  // Unique unit identifier
  childHash: string;                // SHA-256 hash (deterministic)
  
  // Parent relationship
  megaID: string;                   // Parent MegaQR ID
  megaHash: string;                 // Parent MegaQR hash (for verification)
  
  // Product snapshot (immutable at creation)
  productSnapshot: ProductSnapshot;
  
  // Immutable audit trails
  committedMessages: CommittedMessage[]; // Immutable message log
  scanEvents: ScanEvent[];          // Immutable scan log
  
  // Status (deterministic enum)
  status: 'active' | 'sold' | 'recalled' | 'returned';
  
  // Timestamps (ISO 8601, deterministic)
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}

// ============ Request/Response Types ============

export interface CreateMegaQRRequest {
  product: string;
  batchNo: string;
  mfgDate: string;                  // ISO 8601 date
  expiryDate: string;               // ISO 8601 date
  lotSize?: number;                 // Optional lot size hint
  meta?: MegaQRMeta;
}

export interface CreateMegaQRResponse {
  megaID: string;
  megaHash: string;
  success: boolean;
}

export interface GenerateChildQRsRequest {
  megaID: string;
  count?: number;                   // Number of children to generate
  childIDs?: string[];              // Optional specific child IDs
}

export interface GenerateChildQRsResponse {
  childIDs: string[];
  success: boolean;
}

export interface CommitMessageRequest {
  message: string;
  location?: string;
  device?: string;
}

export interface CommitMessageResponse {
  success: boolean;
  txID?: string;
  affectedChildren?: number;
}

export interface VerifyChildQRResponse {
  valid: boolean;
  childQR?: ChildQR;
  megaQR?: MegaQR;
  hashMatch: boolean;
  message: string;
}

// Legacy type alias for backward compatibility (will be removed)
export type ScanLog = ScanEvent;
