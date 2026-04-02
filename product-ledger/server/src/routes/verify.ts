/**
 * Verification routes
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { verifyChildQR, logScan } from '../fabric/client.js';
import { logger } from '../utils/logger.js';

export const verifyRouter = Router();

// All routes require authentication
verifyRouter.use(authenticate);

// Verify ChildQR
verifyRouter.get('/:childID', async (req: AuthRequest, res: Response) => {
  try {
    const { childID } = req.params;

    // Log scan - map user to blockchain actor
    const { getUserActorID } = await import('../fabric/actor-mapping.js');
    const actorID = await getUserActorID(req.user!.id);
    
    await logScan(
      childID,
      null,
      actorID,
      (req.query.location as string) || 'unknown',
      (req.query.device as string) || 'unknown'
    );

    const result = await verifyChildQR(childID);
    res.json(result);
  } catch (error: any) {
    logger.error('Error verifying ChildQR:', error);
    res.status(500).json({
      valid: false,
      hashMatch: false,
      message: error.message || 'Verification failed',
    });
  }
});

