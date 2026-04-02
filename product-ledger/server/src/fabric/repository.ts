/**
 * Product Repository Abstraction
 * 
 * Architecture: This repository provides a clean abstraction layer for product data operations.
 * All product data operations go through this repository, which connects to Hyperledger Fabric.
 * 
 * NO in-memory storage - all operations are persisted to blockchain.
 */

import type { Contract } from 'fabric-network';
import { getNetwork } from './init.js';
import { logger } from '../utils/logger.js';
import type {
  MegaQR,
  ChildQR,
  ScanEvent,
  CommittedMessage,
  CreateMegaQRRequest,
  GenerateChildQRsRequest,
  CommitMessageRequest,
  MegaQRMeta,
} from '../types/fabric.js';

/**
 * Chaincode expects Meta as map[string]string. Flatten nested MegaQRMeta from API clients.
 */
function flattenMegaMetaForChain(meta?: MegaQRMeta | Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!meta || typeof meta !== 'object') return out;

  const m = meta as MegaQRMeta & Record<string, unknown>;
  if (typeof m.notes === 'string' && m.notes.trim()) {
    out.notes = m.notes.trim();
  }
  if (Array.isArray(m.certs)) {
    m.certs.forEach((c, i) => {
      if (typeof c === 'string' && c.trim()) out[`cert_${i}`] = c.trim();
    });
  }
  if (m.customFields && typeof m.customFields === 'object') {
    for (const [k, v] of Object.entries(m.customFields)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
    }
  }
  for (const [k, v] of Object.entries(m)) {
    if (k === 'notes' || k === 'certs' || k === 'customFields') continue;
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  return out;
}

/**
 * Get Fabric contract instance
 */
function getContract(): Contract {
  const network = getNetwork();
  return network.getContract(process.env.FABRIC_CHAINCODE_NAME || 'productledger');
}

/**
 * Submit a transaction with optional explicit endorsing orgs.
 * This prevents commit-time endorsement failures on multi-org channels
 * when discovery/static profiles do not auto-select all required peers.
 */
async function submitWithEndorsementPolicy(
  contract: Contract,
  transactionName: string,
  ...args: string[]
): Promise<Buffer> {
  const tx = contract.createTransaction(transactionName);
  const configuredOrgs = (process.env.FABRIC_ENDORSING_ORGS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (configuredOrgs.length > 0) {
    tx.setEndorsingOrganizations(...configuredOrgs);
  }

  return tx.submit(...args);
}

/**
 * Product Repository Interface
 * All product data operations go through this repository
 */
export class ProductRepository {
  /**
   * Create a new MegaQR (batch) on blockchain
   */
  async createMegaQR(
    request: CreateMegaQRRequest,
    manufacturerID: string,
    manufacturerName: string
  ): Promise<{ megaID: string; megaHash: string }> {
    const contract = getContract();

    const metaFlat = flattenMegaMetaForChain(request.meta);
    if (request.lotSize != null && Number.isFinite(request.lotSize)) {
      metaFlat.lotSize = String(Math.trunc(request.lotSize));
    }

    const result = await submitWithEndorsementPolicy(
      contract,
      'CreateMegaQR',
      JSON.stringify({
        product: request.product,
        batchNo: request.batchNo,
        mfgDate: request.mfgDate,
        expiryDate: request.expiryDate,
        manufacturerID,
        manufacturerName,
        meta: metaFlat,
      })
    );

    const response = JSON.parse(result.toString());
    logger.info(`Created MegaQR on blockchain: ${response.megaID}`);
    return { megaID: response.megaID, megaHash: response.megaHash };
  }

  /**
   * Get MegaQR by ID from blockchain
   */
  async getMegaQR(megaID: string): Promise<MegaQR | null> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('GetMegaQR', megaID);
      return JSON.parse(result.toString());
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return null;
      }
      logger.error('Error getting MegaQR from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get all MegaQRs for a manufacturer from blockchain
   */
  async getManufacturerMegaQRs(manufacturerID: string): Promise<MegaQR[]> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('GetManufacturerMegaQRs', manufacturerID);
      const str = result?.toString()?.trim() ?? '';
      if (!str || str === 'null') return [];
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      logger.error('Error getting manufacturer MegaQRs from blockchain:', error);
      return [];
    }
  }

  /**
   * Generate ChildQRs for a MegaQR on blockchain
   */
  async generateChildQRs(
    request: GenerateChildQRsRequest,
    manufacturerID: string
  ): Promise<{ childIDs: string[] }> {
    const contract = getContract();

    const result = await submitWithEndorsementPolicy(
      contract,
      'GenerateChildQRs',
      request.megaID,
      JSON.stringify({
        count: request.count,
        childIDs: request.childIDs,
        actorID: manufacturerID,
      })
    );

    const parsed = JSON.parse(result.toString());
    // Chaincode returns a raw string[] from GenerateChildQRs.
    // Keep backward compatibility if an object wrapper is returned in future.
    const childIDs = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.childIDs)
        ? parsed.childIDs
        : [];

    logger.info(`Generated ${childIDs.length} ChildQRs on blockchain for MegaQR: ${request.megaID}`);
    return { childIDs };
  }

  /**
   * Get ChildQR by ID from blockchain
   */
  async getChildQR(childID: string): Promise<ChildQR | null> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('GetChildQR', childID);
      return JSON.parse(result.toString());
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        return null;
      }
      logger.error('Error getting ChildQR from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get all ChildQRs for a MegaQR from blockchain
   */
  async getChildrenByMegaID(megaID: string): Promise<ChildQR[]> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('GetChildrenByMegaID', megaID);
      const parsed = JSON.parse(result.toString());
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error: any) {
      logger.error('Error getting children from blockchain (bulk query):', error);

      // Permanent resilience fix:
      // If bulk query fails (e.g., one stale child ID or transient chaincode error),
      // fall back to MegaQR.childList and fetch children one-by-one.
      try {
        const mega = await this.getMegaQR(megaID);
        if (!mega || !Array.isArray(mega.childList) || mega.childList.length === 0) {
          return [];
        }

        const children: ChildQR[] = [];
        for (const childID of mega.childList) {
          try {
            const child = await this.getChildQR(childID);
            if (child) {
              children.push(child);
            }
          } catch (childErr: any) {
            logger.warn(`Skipping unreadable child ${childID}: ${childErr?.message || childErr}`);
          }
        }

        logger.info(`Fallback fetched ${children.length}/${mega.childList.length} children for MegaQR ${megaID}`);
        return children;
      } catch (fallbackErr: any) {
        logger.error('Fallback child fetch failed:', fallbackErr);
        return [];
      }
    }
  }

  /**
   * Commit message to MegaQR on blockchain
   */
  async commitMessageToMega(
    megaID: string,
    request: CommitMessageRequest,
    actorID: string
  ): Promise<{ success: boolean; txID?: string; affectedChildren?: number }> {
    const contract = getContract();

    const result = await submitWithEndorsementPolicy(
      contract,
      'CommitMessageToMega',
      megaID,
      JSON.stringify({
        message: request.message,
        location: request.location,
        device: request.device,
        actorID, // Blockchain actor ID (not user auth)
      })
    );

    const response = JSON.parse(result.toString());
    logger.info(`Committed message to MegaQR on blockchain: ${megaID}`);
    return response;
  }

  /**
   * Commit message to ChildQR on blockchain
   */
  async commitMessageToChild(
    childID: string,
    request: CommitMessageRequest,
    actorID: string
  ): Promise<{ success: boolean; txID?: string }> {
    const contract = getContract();

    const result = await submitWithEndorsementPolicy(
      contract,
      'CommitMessageToChild',
      childID,
      JSON.stringify({
        message: request.message,
        location: request.location,
        device: request.device,
        actorID, // Blockchain actor ID (not user auth)
      })
    );

    const response = JSON.parse(result.toString());
    logger.info(`Committed message to ChildQR on blockchain: ${childID}`);
    return response;
  }

  /**
   * Record scan event on blockchain
   */
  async recordScanEvent(
    productID: string,
    request: { location?: string; device?: string }
  ): Promise<{ success: boolean; txID?: string }> {
    const contract = getContract();

    try {
      const result = await submitWithEndorsementPolicy(
        contract,
        'RecordScanEvent',
        productID,
        JSON.stringify({
          location: request.location,
          device: request.device,
        })
      );

      const response = JSON.parse(result.toString());
      logger.info(`Recorded scan event on blockchain: ${productID}`);
      
      // Sync scan event to read mirror (non-blocking)
      // Note: We need to get the scan event from the product history
      // For now, we'll let the event listener handle it
      
      return response;
    } catch (error: any) {
      logger.error('Error recording scan event:', error);
      throw error;
    }
  }

  /**
   * Update product status on blockchain
   */
  async updateProductStatus(
    productID: string,
    newStatus: string
  ): Promise<{ success: boolean; oldStatus: string; newStatus: string }> {
    const contract = getContract();

    try {
      const result = await submitWithEndorsementPolicy(
        contract,
        'UpdateProductStatus',
        productID,
        newStatus
      );

      const response = JSON.parse(result.toString());
      logger.info(`Updated product status on blockchain: ${productID} -> ${newStatus}`);
      return response;
    } catch (error: any) {
      logger.error('Error updating product status:', error);
      throw error;
    }
  }

  /**
   * Get product history from blockchain
   */
  async getProductHistory(productID: string): Promise<any> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('GetProductHistory', productID);
      return JSON.parse(result.toString());
    } catch (error: any) {
      logger.error('Error getting product history:', error);
      throw error;
    }
  }

  /**
   * Create single child QR (new chaincode function)
   */
  async createChildQR(
    megaID: string,
    childID: string
  ): Promise<{ childID: string; childHash: string }> {
    const contract = getContract();

    try {
      const result = await submitWithEndorsementPolicy(contract, 'CreateChildQR', megaID, childID);
      const response = JSON.parse(result.toString());
      logger.info(`Created ChildQR on blockchain: ${childID}`);
      return { childID: response.childID, childHash: response.childHash };
    } catch (error: any) {
      logger.error('Error creating ChildQR:', error);
      throw error;
    }
  }

  /**
   * Verify product (alias for VerifyChildQR)
   */
  async verifyProduct(productID: string): Promise<{
    valid: boolean;
    childQR?: ChildQR;
    megaQR?: MegaQR;
    hashMatch: boolean;
    message: string;
  }> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('VerifyProduct', productID);
      return JSON.parse(result.toString());
    } catch (error: any) {
      logger.error('Error verifying product:', error);
      throw error;
    }
  }

  /**
   * Log scan event on blockchain (deprecated - use recordScanEvent)
   */
  async logScanEvent(
    scanEvent: ScanEvent
  ): Promise<{ success: boolean; txID?: string }> {
    // Use new RecordScanEvent function
    const productID = scanEvent.childID || scanEvent.megaID || '';
    if (!productID) {
      throw new Error('Product ID required for scan event');
    }

    return this.recordScanEvent(productID, {
      location: scanEvent.location,
      device: scanEvent.device,
    });
  }

  /**
   * Verify ChildQR authenticity on blockchain
   */
  async verifyChildQR(childID: string): Promise<{
    valid: boolean;
    childQR?: ChildQR;
    megaQR?: MegaQR;
    hashMatch: boolean;
    message: string;
  }> {
    const contract = getContract();

    try {
      const result = await contract.evaluateTransaction('VerifyChildQR', childID);
      return JSON.parse(result.toString());
    } catch (error) {
      logger.error('Error verifying ChildQR on blockchain:', error);
      return {
        valid: false,
        hashMatch: false,
        message: 'Verification failed',
      };
    }
  }
}

// Singleton instance
let repositoryInstance: ProductRepository | null = null;

/**
 * Get repository instance
 */
export function getProductRepository(): ProductRepository {
  if (!repositoryInstance) {
    repositoryInstance = new ProductRepository();
  }
  return repositoryInstance;
}

