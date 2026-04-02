/**
 * ChildQR routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { authenticateAPIKeyOrJWT, APIKeyRequest } from '../middleware/api-key-auth.js';
import { apiKeyRateLimiter } from '../middleware/rate-limit.js';
import { logAPIKeyUsageMiddleware } from '../middleware/api-key-usage-log.js';
import { getChildQR, commitMessageToChild } from '../fabric/client.js';
import { logScan } from '../fabric/client.js';
import { logger } from '../utils/logger.js';

export const childQRRouter = Router();

// All routes require authentication (API key OR JWT)
childQRRouter.use(authenticateAPIKeyOrJWT);
childQRRouter.use(apiKeyRateLimiter);
childQRRouter.use(logAPIKeyUsageMiddleware);

// Get ChildQR by ID
childQRRouter.get('/:childID', async (req: AuthRequest, res: Response) => {
  try {
    const { childID } = req.params;
    const childQR = await getChildQR(childID);

    if (!childQR) {
      return res.status(404).json({ error: 'ChildQR not found' });
    }

    // Log scan - map user to blockchain actor
    const { getUserActorID } = await import('../fabric/actor-mapping.js');
    const actorID = await getUserActorID(req.user!.id);
    
    await logScan(
      childID,
      childQR.megaID,
      actorID,
      (req.query.location as string) || 'unknown',
      (req.query.device as string) || 'unknown'
    );

    res.json(childQR);
  } catch (error: any) {
    logger.error('Error getting ChildQR:', error);
    res.status(500).json({ error: error.message || 'Failed to get ChildQR' });
  }
});

// Commit message to ChildQR (Retailer only)
childQRRouter.post(
  '/:childID/commit',
  authorize('retailer', 'admin'),
  [body('message').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { childID } = req.params;
      const childQR = await getChildQR(childID);

      if (!childQR) {
        return res.status(404).json({ error: 'ChildQR not found' });
      }

      // Map user ID to blockchain actor ID
      const { getUserActorID } = await import('../fabric/actor-mapping.js');
      const actorID = await getUserActorID(req.user!.id);
      
      const result = await commitMessageToChild(
        childID,
        req.body,
        actorID
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Error committing message to ChildQR:', error);
      res.status(500).json({ error: error.message || 'Failed to commit message' });
    }
  }
);

