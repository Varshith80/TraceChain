/**
 * Canonical Data Models for Blockchain (Frontend)
 * 
 * Architecture Rules:
 * - Models match backend canonical models exactly
 * - NO user authentication fields (auth is centralized)
 * - All timestamps use ISO 8601 format
 * - All IDs and hashes are strings
 */

/**
 * CommittedMessage - Immutable audit entry on blockchain
 */
export interface CommittedMessage {
  msg: string;                    // Message content
  actorID: string;                // Blockchain actor ID (NOT user auth)
  ts: string;                     // ISO 8601 timestamp
  location?: string;              // Optional location
  device?: string;                // Optional device
  txHash?: string;                // Transaction hash
}

/**
 * ScanEvent - Product scan event on blockchain
 */
export interface ScanEvent {
  childID?: string;               // ChildQR ID (if scanning unit)
  megaID?: string;                // MegaQR ID (if scanning batch)
  actorID: string;                 // Blockchain actor ID
  ts: string;                     // ISO 8601 timestamp
  location?: string;              // Optional location
  device?: string;                // Optional device
  txHash?: string;                // Transaction hash
}

/**
 * MegaQRMeta - Metadata for MegaQR
 */
export interface MegaQRMeta {
  notes?: string;
  certs?: string[];
  customFields?: Record<string, string>;
}

/**
 * MegaQR - Batch-level product on blockchain
 */
export interface MegaQR {
  objectType: 'MegaQR';
  megaID: string;
  megaHash: string;
  product: string;
  batchNo: string;
  mfgDate: string;                // ISO 8601 date (YYYY-MM-DD)
  expiryDate: string;              // ISO 8601 date (YYYY-MM-DD)
  manufacturerID: string;          // Blockchain actor ID
  manufacturerName?: string;
  childList: string[];
  committedMessages: CommittedMessage[];
  meta: MegaQRMeta;
  version: string;
  status: 'active' | 'recalled' | 'expired';
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
}

/**
 * ProductSnapshot - Snapshot of product data at ChildQR creation
 */
export interface ProductSnapshot {
  product: string;
  batchNo: string;
  mfgDate: string;                // ISO 8601 date (YYYY-MM-DD)
  expiryDate: string;              // ISO 8601 date (YYYY-MM-DD)
  manufacturerID: string;          // Blockchain actor ID
  manufacturerName?: string;
}

/**
 * ChildQR - Unit-level product on blockchain
 */
export interface ChildQR {
  objectType: 'ChildQR';
  childID: string;
  childHash: string;
  megaID: string;
  megaHash: string;
  productSnapshot: ProductSnapshot;
  committedMessages: CommittedMessage[];
  scanEvents: ScanEvent[];        // Changed from scanLogs to scanEvents
  status: 'active' | 'sold' | 'recalled' | 'returned';
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
}

// ============ Request/Response Types ============

export interface CreateMegaQRRequest {
  product: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  lotSize?: number;
  meta?: MegaQRMeta;
}

export interface CreateMegaQRResponse {
  megaID: string;
  megaHash: string;
  success: boolean;
}

export interface GenerateChildQRsRequest {
  megaID: string;
  count?: number;
  childIDs?: string[];
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

// ============ Admin / Audit / Reporting ============

export interface AuditLog {
  id: string;
  action: string;
  targetType: 'MegaQR' | 'ChildQR' | string;
  targetID: string;
  performedBy: string;
  performedByRole: AppRole;
  details: string;
  txID?: string;
  timestamp: string;
}

export interface CounterfeitReport {
  id: string;
  childID: string;
  megaID?: string | null;
  description: string;
  evidence?: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface RecallProductRequest {
  megaID: string;
  reason: string;
}

export interface RecallProductResponse {
  success: boolean;
  affectedChildren?: number;
}

// ============ Retailer Message UI helpers ============

export type RetailerMessage =
  | 'Received at Retailer'
  | 'Stocked'
  | 'On Shelf'
  | 'Sold'
  | 'Returned'
  | 'Damaged - Returned to Manufacturer'
  | string;

export const RETAILER_MESSAGE_TEMPLATES: ReadonlyArray<{
  value: RetailerMessage;
  label: string;
}> = [
  { value: 'Received at Retailer', label: 'Received at Retailer' },
  { value: 'Stocked', label: 'Stocked' },
  { value: 'On Shelf', label: 'On Shelf' },
  { value: 'Sold', label: 'Sold' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Damaged - Returned to Manufacturer', label: 'Damaged - Returned to Manufacturer' },
] as const;

// Legacy type alias for backward compatibility
export type ScanLog = ScanEvent;

// AppRole type (used in UI, not in blockchain models)
export type AppRole = 'admin' | 'manufacturer' | 'retailer' | 'consumer';
