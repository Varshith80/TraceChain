/**
 * Counterfeit reporting routes
 * Uses Supabase for persistence (if counterfeit_reports table exists)
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getSupabase } from '../lib/supabase.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.post(
  '/counterfeit',
  [
    body('childID').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('evidence').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { childID, megaID, description, evidence } = req.body;
      const reportID = randomUUID();

      try {
        const supabase = getSupabase();
        const { error } = await (supabase as any).from('counterfeit_reports').insert({
          id: reportID,
          child_id: childID,
          mega_id: megaID || null,
          reported_by: req.user!.id,
          reporter_email: req.user!.email,
          reporter_phone: null,
          description,
          evidence: evidence || [],
          status: 'pending',
        });

        if (error) {
          logger.warn('Counterfeit report insert failed (table may not exist):', error);
          return res.status(503).json({
            error: 'Counterfeit reporting not configured',
            message: 'counterfeit_reports table is required in Supabase. Report logged locally.',
            reportID,
          });
        }
      } catch (err) {
        logger.warn('Counterfeit report failed:', err);
        return res.status(503).json({
          error: 'Counterfeit reporting unavailable',
          reportID,
        });
      }

      logger.warn(`Counterfeit report submitted: ${childID} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        reportID,
      });
    } catch (error: any) {
      logger.error('Error submitting counterfeit report:', error);
      res.status(500).json({ error: error.message || 'Failed to submit report' });
    }
  }
);
