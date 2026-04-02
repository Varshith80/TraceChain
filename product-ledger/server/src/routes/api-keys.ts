/**
 * API Key Management Routes
 * 
 * Routes for manufacturers to manage their API keys
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { authenticateAPIKey, APIKeyRequest } from '../middleware/api-key-auth.js';
import {
  createAPIKey,
  getAPIKeysByManufacturer,
  revokeAPIKey,
  updateAPIKeyRateLimits,
  getAPIKeyById,
} from '../database/api-keys.js';
import { logger } from '../utils/logger.js';
import { createError } from '../middleware/errorHandler.js';
import { body, validationResult } from 'express-validator';

export const apiKeyRouter = Router();

// All routes require authentication (JWT or API key)
apiKeyRouter.use(authenticate);

/**
 * Create a new API key
 * POST /api/api-keys
 * Only manufacturers can create API keys
 */
apiKeyRouter.post(
  '/',
  authorize('manufacturer', 'admin'),
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('rateLimitPerMinute').optional().isInt({ min: 1, max: 10000 }),
    body('rateLimitPerHour').optional().isInt({ min: 1, max: 100000 }),
    body('rateLimitPerDay').optional().isInt({ min: 1, max: 1000000 }),
    body('expiresAt').optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, rateLimitPerMinute, rateLimitPerHour, rateLimitPerDay, expiresAt } = req.body;
      const manufacturerId = req.user!.id;

      const result = await createAPIKey(
        manufacturerId,
        name,
        description,
        {
          perMinute: rateLimitPerMinute,
          perHour: rateLimitPerHour,
          perDay: rateLimitPerDay,
        },
        expiresAt
      );

      logger.info(`API key created: ${result.apiKey.keyPrefix} for manufacturer: ${manufacturerId}`);

      res.status(201).json({
        success: true,
        apiKey: {
          id: result.apiKey.id,
          keyPrefix: result.apiKey.keyPrefix,
          name: result.apiKey.name,
          description: result.apiKey.description,
          rateLimitPerMinute: result.apiKey.rateLimitPerMinute,
          rateLimitPerHour: result.apiKey.rateLimitPerHour,
          rateLimitPerDay: result.apiKey.rateLimitPerDay,
          expiresAt: result.apiKey.expiresAt,
          createdAt: result.apiKey.createdAt,
        },
        // Plaintext key only returned once
        plaintextKey: result.plaintextKey,
        warning: 'Store this API key securely. It will not be shown again.',
      });
    } catch (error: any) {
      logger.error('Error creating API key:', error);
      res.status(500).json({
        error: 'Failed to create API key',
        message: error.message,
      });
    }
  }
);

/**
 * Get all API keys for the authenticated manufacturer
 * GET /api/api-keys
 */
apiKeyRouter.get(
  '/',
  authorize('manufacturer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const manufacturerId = req.user!.id;
      const apiKeys = await getAPIKeysByManufacturer(manufacturerId);

      // Remove sensitive data (key hash)
      const sanitizedKeys = apiKeys.map(key => ({
        id: key.id,
        keyPrefix: key.keyPrefix,
        name: key.name,
        description: key.description,
        rateLimitPerMinute: key.rateLimitPerMinute,
        rateLimitPerHour: key.rateLimitPerHour,
        rateLimitPerDay: key.rateLimitPerDay,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        revokedAt: key.revokedAt,
        revokedReason: key.revokedReason,
      }));

      res.json({
        success: true,
        apiKeys: sanitizedKeys,
      });
    } catch (error: any) {
      logger.error('Error getting API keys:', error);
      res.status(500).json({
        error: 'Failed to get API keys',
        message: error.message,
      });
    }
  }
);

/**
 * Get a specific API key
 * GET /api/api-keys/:id
 */
apiKeyRouter.get(
  '/:id',
  authorize('manufacturer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const manufacturerId = req.user!.id;

      const apiKey = await getAPIKeyById(id);

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found',
        });
      }

      // Verify ownership (unless admin)
      if (apiKey.manufacturerId !== manufacturerId && req.user!.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this API key',
        });
      }

      // Remove sensitive data
      const sanitizedKey = {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        description: apiKey.description,
        rateLimitPerMinute: apiKey.rateLimitPerMinute,
        rateLimitPerHour: apiKey.rateLimitPerHour,
        rateLimitPerDay: apiKey.rateLimitPerDay,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        revokedAt: apiKey.revokedAt,
        revokedReason: apiKey.revokedReason,
      };

      res.json({
        success: true,
        apiKey: sanitizedKey,
      });
    } catch (error: any) {
      logger.error('Error getting API key:', error);
      res.status(500).json({
        error: 'Failed to get API key',
        message: error.message,
      });
    }
  }
);

/**
 * Revoke an API key
 * DELETE /api/api-keys/:id
 */
apiKeyRouter.delete(
  '/:id',
  authorize('manufacturer', 'admin'),
  [
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const manufacturerId = req.user!.id;

      const apiKey = await getAPIKeyById(id);

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found',
        });
      }

      // Verify ownership (unless admin)
      if (apiKey.manufacturerId !== manufacturerId && req.user!.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to revoke this API key',
        });
      }

      await revokeAPIKey(id, req.body.reason);

      logger.info(`API key revoked: ${id} by user: ${manufacturerId}`);

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error: any) {
      logger.error('Error revoking API key:', error);
      res.status(500).json({
        error: 'Failed to revoke API key',
        message: error.message,
      });
    }
  }
);

/**
 * Update API key rate limits
 * PATCH /api/api-keys/:id/rate-limits
 */
apiKeyRouter.patch(
  '/:id/rate-limits',
  authorize('manufacturer', 'admin'),
  [
    body('rateLimitPerMinute').optional().isInt({ min: 1, max: 10000 }),
    body('rateLimitPerHour').optional().isInt({ min: 1, max: 100000 }),
    body('rateLimitPerDay').optional().isInt({ min: 1, max: 1000000 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const manufacturerId = req.user!.id;

      const apiKey = await getAPIKeyById(id);

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found',
        });
      }

      // Verify ownership (unless admin)
      if (apiKey.manufacturerId !== manufacturerId && req.user!.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update this API key',
        });
      }

      await updateAPIKeyRateLimits(id, {
        perMinute: req.body.rateLimitPerMinute,
        perHour: req.body.rateLimitPerHour,
        perDay: req.body.rateLimitPerDay,
      });

      logger.info(`API key rate limits updated: ${id} by user: ${manufacturerId}`);

      res.json({
        success: true,
        message: 'Rate limits updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating rate limits:', error);
      res.status(500).json({
        error: 'Failed to update rate limits',
        message: error.message,
      });
    }
  }
);

