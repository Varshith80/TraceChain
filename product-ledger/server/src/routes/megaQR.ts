/**
 * MegaQR routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { authenticateAPIKeyOrJWT, APIKeyRequest } from '../middleware/api-key-auth.js';
import { apiKeyRateLimiter } from '../middleware/rate-limit.js';
import { logAPIKeyUsageMiddleware } from '../middleware/api-key-usage-log.js';
import { createError } from '../middleware/errorHandler.js';
import {
  createMegaQR,
  getMegaQR,
  getManufacturerMegaQRs,
  generateChildQRs,
  commitMessageToMega,
  getChildrenByMegaID,
} from '../fabric/client.js';
import { getUserById } from '../database/users.js';
import { logScan } from '../fabric/client.js';
import { logger } from '../utils/logger.js';

export const megaQRRouter = Router();

// All routes require authentication (API key OR JWT)
megaQRRouter.use(authenticateAPIKeyOrJWT);
megaQRRouter.use(apiKeyRateLimiter);
megaQRRouter.use(logAPIKeyUsageMiddleware);

// Create MegaQR (Manufacturer only)
megaQRRouter.post(
  '/',
  authorize('manufacturer', 'admin'),
  [
    body('product').notEmpty().trim(),
    body('batchNo').notEmpty().trim(),
    body('mfgDate').isISO8601(),
    body('expiryDate').isISO8601(),
    body('lotSize').optional().isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const result = await createMegaQR(
        req.body,
        req.user!.id,
        user.companyName || user.fullName || 'Unknown'
      );

      res.status(201).json({
        ...result,
        success: true,
      });
    } catch (error: any) {
      logger.error('Error creating MegaQR:', error);
      res.status(500).json({ error: error.message || 'Failed to create MegaQR' });
    }
  }
);

// Get MegaQR by ID
megaQRRouter.get('/:megaID', async (req: AuthRequest, res: Response) => {
  try {
    const { megaID } = req.params;
    const megaQR = await getMegaQR(megaID);

    if (!megaQR) {
      return res.status(404).json({ error: 'MegaQR not found' });
    }

    // Check access: manufacturer can only see their own, admin can see all
    if (req.user!.role !== 'admin' && megaQR.manufacturerID !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(megaQR);
  } catch (error: any) {
    logger.error('Error getting MegaQR:', error);
    res.status(500).json({ error: error.message || 'Failed to get MegaQR' });
  }
});

// Get manufacturer's MegaQRs
megaQRRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { manufacturerID } = req.query;

    // Admin can query any manufacturer, others can only query themselves
    const queryID = req.user!.role === 'admin' && manufacturerID
      ? manufacturerID as string
      : req.user!.id;

    if (req.user!.role !== 'admin' && queryID !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const megaQRs = await getManufacturerMegaQRs(queryID);
    res.json(megaQRs);
  } catch (error: any) {
    logger.error('Error getting manufacturer MegaQRs:', error);
    res.status(500).json({ error: error.message || 'Failed to get MegaQRs' });
  }
});

// Generate ChildQRs (Manufacturer only)
megaQRRouter.post(
  '/:megaID/generate-children',
  authorize('manufacturer', 'admin'),
  [
    body('count').optional().isInt({ min: 1, max: 10000 }),
    body('childIDs').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { megaID } = req.params;
      const megaQR = await getMegaQR(megaID);

      if (!megaQR) {
        return res.status(404).json({ error: 'MegaQR not found' });
      }

      // Check ownership
      if (req.user!.role !== 'admin' && megaQR.manufacturerID !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await generateChildQRs(
        {
          megaID,
          count: req.body.count,
          childIDs: req.body.childIDs,
        },
        req.user!.id
      );

      res.json({
        ...result,
        success: true,
      });
    } catch (error: any) {
      logger.error('Error generating ChildQRs:', error);
      res.status(500).json({ error: error.message || 'Failed to generate ChildQRs' });
    }
  }
);

// Commit message to MegaQR
megaQRRouter.post(
  '/:megaID/commit',
  authorize('manufacturer', 'admin'),
  [body('message').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { megaID } = req.params;
      const megaQR = await getMegaQR(megaID);

      if (!megaQR) {
        return res.status(404).json({ error: 'MegaQR not found' });
      }

      // Check ownership
      if (req.user!.role !== 'admin' && megaQR.manufacturerID !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Map user ID to blockchain actor ID
      const { getUserActorID } = await import('../fabric/actor-mapping.js');
      const actorID = await getUserActorID(req.user!.id);
      
      const result = await commitMessageToMega(
        megaID,
        req.body,
        actorID
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Error committing message to MegaQR:', error);
      res.status(500).json({ error: error.message || 'Failed to commit message' });
    }
  }
);

// Get children by MegaID
megaQRRouter.get('/:megaID/children', async (req: AuthRequest, res: Response) => {
  try {
    const { megaID } = req.params;
    const megaQR = await getMegaQR(megaID);

    if (!megaQR) {
      return res.status(404).json({ error: 'MegaQR not found' });
    }

    // Check access
    if (req.user!.role !== 'admin' && megaQR.manufacturerID !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For large batches, returning all children can be slow / exceed payload limits.
    // Support pagination: /children?limit=50&offset=0
    const limitRaw = req.query.limit as string | undefined;
    const offsetRaw = req.query.offset as string | undefined;
    const idsOnly = (req.query.idsOnly as string | undefined) === '1';

    if (idsOnly) {
      return res.json({
        megaID,
        total: megaQR.childList.length,
        childIDs: megaQR.childList,
      });
    }

    const limit = limitRaw ? Math.max(1, Math.min(500, parseInt(limitRaw, 10))) : undefined;
    const offset = offsetRaw ? Math.max(0, parseInt(offsetRaw, 10)) : 0;

    if (limit !== undefined) {
      // Slice real ChildQR objects from the chaincode response.
      // This keeps the response shape consistent and avoids missing-child issues.
      const allChildren = await getChildrenByMegaID(megaID);
      const sliced = allChildren.slice(offset, offset + limit);
      return res.json({
        megaID,
        total: allChildren.length,
        offset,
        limit,
        children: sliced,
      });
    }

    const children = await getChildrenByMegaID(megaID);
    res.json(children);
  } catch (error: any) {
    logger.error('Error getting children:', error);
    res.status(500).json({ error: error.message || 'Failed to get children' });
  }
});

