/**
 * Hyperledger Fabric client
 * Handles all blockchain operations
 * 
 * Architecture: Uses ProductRepository abstraction - NO in-memory storage
 */

import { logger } from '../utils/logger.js';
import { getProductRepository } from './repository.js';
import type {
  MegaQR,
  ChildQR,
  ScanEvent,
  CreateMegaQRRequest,
  GenerateChildQRsRequest,
  CommitMessageRequest,
} from '../types/fabric.js';

// Helper functions removed - ID and hash generation now handled by chaincode

/**
 * Create MegaQR on blockchain
 * Architecture: Uses repository abstraction - NO in-memory storage
 */
export async function createMegaQR(
  request: CreateMegaQRRequest,
  manufacturerID: string,
  manufacturerName: string
): Promise<{ megaID: string; megaHash: string }> {
  const repo = getProductRepository();
  return repo.createMegaQR(request, manufacturerID, manufacturerName);
}

/**
 * Get MegaQR from blockchain
 * Architecture: Uses repository abstraction - cache is read-optimized mirror
 */
export async function getMegaQR(megaID: string): Promise<MegaQR | null> {
  const repo = getProductRepository();
  return repo.getMegaQR(megaID);
}

/**
 * Get all MegaQRs for a manufacturer
 * Architecture: Uses repository abstraction
 */
export async function getManufacturerMegaQRs(manufacturerID: string): Promise<MegaQR[]> {
  const repo = getProductRepository();
  return repo.getManufacturerMegaQRs(manufacturerID);
}

/**
 * Generate ChildQRs for a MegaQR
 * Architecture: Uses repository abstraction
 */
export async function generateChildQRs(
  request: GenerateChildQRsRequest,
  manufacturerID: string
): Promise<{ childIDs: string[] }> {
  const repo = getProductRepository();
  return repo.generateChildQRs(request, manufacturerID);
}

/**
 * Get ChildQR from blockchain
 * Architecture: Uses repository abstraction
 */
export async function getChildQR(childID: string): Promise<ChildQR | null> {
  const repo = getProductRepository();
  return repo.getChildQR(childID);
}

/**
 * Get all ChildQRs for a MegaQR
 * Architecture: Uses repository abstraction
 */
export async function getChildrenByMegaID(megaID: string): Promise<ChildQR[]> {
  const repo = getProductRepository();
  return repo.getChildrenByMegaID(megaID);
}

/**
 * Commit message to MegaQR
 * Architecture: Uses repository abstraction - actorID is blockchain identity, not user auth
 */
export async function commitMessageToMega(
  megaID: string,
  request: CommitMessageRequest,
  actorID: string  // Changed from userID - this is blockchain actor ID
): Promise<{ success: boolean; txID?: string; affectedChildren?: number }> {
  const repo = getProductRepository();
  return repo.commitMessageToMega(megaID, request, actorID);
}

/**
 * Commit message to ChildQR
 * Architecture: Uses repository abstraction - actorID is blockchain identity
 */
export async function commitMessageToChild(
  childID: string,
  request: CommitMessageRequest,
  actorID: string  // Changed from userID - this is blockchain actor ID
): Promise<{ success: boolean; txID?: string }> {
  const repo = getProductRepository();
  return repo.commitMessageToChild(childID, request, actorID);
}

/**
 * Verify ChildQR authenticity
 * Architecture: Uses repository abstraction - always verifies from Fabric
 */
export async function verifyChildQR(childID: string): Promise<{
  valid: boolean;
  childQR?: ChildQR;
  megaQR?: MegaQR;
  hashMatch: boolean;
  message: string;
}> {
  const repo = getProductRepository();
  return repo.verifyChildQR(childID);
}

/**
 * Record scan event
 * Architecture: Uses repository abstraction - writes ScanEvent to blockchain
 */
export async function recordScanEvent(
  productID: string,
  actorID: string,  // Blockchain actor ID
  location?: string,
  device?: string
): Promise<{ success: boolean; txID?: string }> {
  const repo = getProductRepository();
  const result = await repo.recordScanEvent(productID, { location, device });
  logger.info(`Scan event recorded on blockchain: ${productID} by actor ${actorID}`);
  return result;
}

/**
 * Log scan event (legacy - use recordScanEvent instead)
 */
export async function logScan(
  childID: string | null,
  megaID: string | null,
  actorID: string,
  location?: string,
  device?: string
): Promise<void> {
  const productID = childID || megaID;
  if (!productID) {
    throw new Error('Product ID required for scan event');
  }
  await recordScanEvent(productID, actorID, location, device);
}

/**
 * Update product status
 */
export async function updateProductStatus(
  productID: string,
  newStatus: string
): Promise<{ success: boolean; oldStatus: string; newStatus: string }> {
  const repo = getProductRepository();
  const result = await repo.updateProductStatus(productID, newStatus);
  logger.info(`Product status updated: ${productID} -> ${newStatus}`);
  return result;
}

/**
 * Get product history
 */
export async function getProductHistory(productID: string): Promise<any> {
  const repo = getProductRepository();
  return await repo.getProductHistory(productID);
}

/**
 * Create single child QR
 */
export async function createChildQR(
  megaID: string,
  childID: string
): Promise<{ childID: string; childHash: string }> {
  const repo = getProductRepository();
  return repo.createChildQR(megaID, childID);
}

