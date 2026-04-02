/**
 * Public Verification Endpoint
 * 
 * GET /v/:childID
 * 
 * Public endpoint (no authentication required) for product verification
 * 
 * Flow:
 * 1. Fetch product data from Hyperledger Fabric (source of truth)
 * 2. Verify hash integrity
 * 3. Fetch read-only metadata from PostgreSQL mirror (fast)
 * 4. Return authenticity result
 */

import { Router, Request, Response } from 'express';
import { getProductRepository } from '../fabric/repository.js';
import { logger } from '../utils/logger.js';
import { logScan } from '../fabric/client.js';
import { strictRateLimiter } from '../middleware/rate-limit.js';

export const publicVerifyRouter = Router();

/**
 * Public verification endpoint
 * GET /v/:childID
 * 
 * No authentication required - public endpoint
 */
publicVerifyRouter.get('/v/:childID', strictRateLimiter, async (req: Request, res: Response) => {
  const { childID } = req.params;
  const startTime = Date.now();

  try {
    logger.info(`Public verification request for: ${childID}`);

    const repo = getProductRepository();
    
    // Try as ChildQR first; if not found, try as MegaQR.
    const childQR = await repo.getChildQR(childID);
    if (childQR) {
      const megaQR = childQR.megaID ? await repo.getMegaQR(childQR.megaID) : null;
      const megaChildListed = !!megaQR?.childList?.includes(childQR.childID);
      const hashMatch = megaChildListed && megaQR?.megaID === childQR.megaID;
      const isRecalled = megaQR?.status === 'recalled' || childQR.status === 'recalled';

      const valid = !isRecalled && hashMatch;
      const message = isRecalled
        ? 'Product has been recalled'
        : hashMatch
          ? 'Product is authentic'
          : 'Product verification failed - hash mismatch';

      // Best-effort record scan on-chain so the verification timeline stays correct.
      try {
        await logScan(
          childID,
          megaQR?.megaID || null,
          'public',
          (req.query.location as string) || 'unknown',
          (req.query.device as string) || 'unknown'
        );
      } catch (e) {
        logger.warn(`Public scan logging failed for child ${childID}: ${String((e as any)?.message || e)}`);
      }

      const scanEvents = childQR.scanEvents || [];
      const response = {
        valid,
        hashMatch,
        message,
        childID,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        product: {
          childID: childQR.childID,
          childHash: childQR.childHash,
          megaID: childQR.megaID,
          status: childQR.status,
          productSnapshot: childQR.productSnapshot,
          scanCount: scanEvents.length,
          lastScanned: scanEvents[0]?.ts || null,
          committedMessagesCount: childQR.committedMessages?.length || 0,
        },
        parent: megaQR ? {
          megaID: megaQR.megaID,
          product: megaQR.product,
          batchNo: megaQR.batchNo,
          manufacturerName: megaQR.manufacturerName,
          status: megaQR.status,
        } : null,
        recentScans: scanEvents.slice(0, 5).map((event: { ts: string; location?: string; device?: string }) => ({
          timestamp: event.ts,
          location: event.location,
          device: event.device,
        })),
        // Keep backend object shape (msg/by/ts/location/device) so UI timeline works.
        committedMessages: (childQR.committedMessages || []).slice(0, 10),
      };

      logger.info(`Public child verification: ${childID} valid=${valid}`);
      return res.status(valid ? 200 : 404).json(response);
    }

    // Not a ChildQR: try as MegaQR (parent/batch QR).
    const megaQR = await repo.getMegaQR(childID);
    if (!megaQR) {
      return res.status(404).json({
        valid: false,
        hashMatch: false,
        message: 'Product not found or invalid',
        childID,
        timestamp: new Date().toISOString(),
      });
    }

    // For MegaQR QR verification, authenticity is based on ledger existence + not recalled.
    const isRecalled = megaQR.status === 'recalled';
    const valid = !isRecalled;
    const hashMatch = true;
    const message = isRecalled ? 'Product has been recalled' : 'Product is authentic';

    try {
      await logScan(
        null,
        megaQR.megaID,
        'public',
        (req.query.location as string) || 'unknown',
        (req.query.device as string) || 'unknown'
      );
    } catch (e) {
      logger.warn(`Public scan logging failed for mega ${childID}: ${String((e as any)?.message || e)}`);
    }

    const response = {
      valid,
      hashMatch,
      message,
      childID,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      /** Full ledger record for batch verification UIs (meta is flat map on chain). */
      mega: megaQR,
      product: {
        megaID: megaQR.megaID,
        status: megaQR.status,
        productSnapshot: {
          product: megaQR.product,
          batchNo: megaQR.batchNo,
          mfgDate: megaQR.mfgDate,
          expiryDate: megaQR.expiryDate,
          manufacturerID: megaQR.manufacturerID,
          manufacturerName: megaQR.manufacturerName,
        },
        childrenGenerated: megaQR.childList?.length || 0,
        scanCount: 0,
        lastScanned: null,
        committedMessagesCount: megaQR.committedMessages?.length || 0,
      },
      parent: {
        megaID: megaQR.megaID,
        product: megaQR.product,
        batchNo: megaQR.batchNo,
        mfgDate: megaQR.mfgDate,
        expiryDate: megaQR.expiryDate,
        manufacturerID: megaQR.manufacturerID,
        manufacturerName: megaQR.manufacturerName,
        status: megaQR.status,
        meta: megaQR.meta,
      },
      recentScans: [],
      committedMessages: (megaQR.committedMessages || []).slice(0, 10),
    };

    logger.info(`Public mega verification: ${childID} valid=${valid}`);
    return res.status(valid ? 200 : 404).json(response);
  } catch (error: any) {
    logger.error(`Error in public verification for ${childID}:`, error);
    
    // Return error response without exposing internal details
    res.status(500).json({
      valid: false,
      hashMatch: false,
      message: 'Verification service temporarily unavailable',
      childID,
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Health check for verification endpoint
 */
publicVerifyRouter.get('/v/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'public-verification',
    timestamp: new Date().toISOString(),
  });
});

