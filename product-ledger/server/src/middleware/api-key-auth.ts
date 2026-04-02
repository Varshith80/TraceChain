/**
 * API Key Authentication Middleware
 * 
 * Authenticates requests using API keys (for manufacturers)
 * Works alongside JWT authentication (users can still use JWT)
 */

import { Request, Response, NextFunction } from 'express';
import { validateAPIKey } from '../database/api-keys.js';
import { getUserById } from '../database/users.js';
import { createError } from './errorHandler.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from './auth.js';

export interface APIKeyRequest extends AuthRequest {
  apiKey?: {
    id: string;
    manufacturerId: string;
    keyPrefix: string;
    name: string;
    rateLimitPerMinute: number;
    rateLimitPerHour: number;
    rateLimitPerDay: number;
  };
}

/**
 * Authenticate using API key
 * Looks for API key in X-API-Key header or Authorization header
 */
export async function authenticateAPIKey(
  req: APIKeyRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'] as string || 
                   req.headers['authorization']?.replace(/^ApiKey /i, '');

    if (!apiKey) {
      return next(createError(401, 'API key not provided'));
    }

    // Validate API key
    const keyData = await validateAPIKey(apiKey);

    if (!keyData) {
      logger.warn(`Invalid API key attempt from ${req.ip}`);
      return next(createError(401, 'Invalid API key'));
    }

    // Get manufacturer user
    const manufacturer = await getUserById(keyData.manufacturerId);

    if (!manufacturer) {
      return next(createError(401, 'Manufacturer not found'));
    }

    if (!manufacturer.approved) {
      return next(createError(403, 'Manufacturer account not approved'));
    }

    if (manufacturer.role !== 'manufacturer') {
      return next(createError(403, 'API keys are only available for manufacturers'));
    }

    // Attach API key and user info to request
    req.apiKey = {
      id: keyData.id,
      manufacturerId: keyData.manufacturerId,
      keyPrefix: keyData.keyPrefix,
      name: keyData.name,
      rateLimitPerMinute: keyData.rateLimitPerMinute,
      rateLimitPerHour: keyData.rateLimitPerHour,
      rateLimitPerDay: keyData.rateLimitPerDay,
    };

    req.user = {
      id: manufacturer.id,
      email: manufacturer.email,
      role: manufacturer.role,
      approved: manufacturer.approved,
    };

    next();
  } catch (error: any) {
    logger.error('API key authentication error:', error);
    next(createError(500, 'Authentication error'));
  }
}

/**
 * Authenticate using either API key OR JWT token
 * Tries API key first, then falls back to JWT
 */
export async function authenticateAPIKeyOrJWT(
  req: APIKeyRequest,
  res: Response,
  next: NextFunction
) {
  // Try API key first
  const apiKeyHeader = req.headers['x-api-key'] as string;
  const authHeader = req.headers['authorization'] as string;

  // Check for API key in X-API-Key header
  if (apiKeyHeader) {
    return authenticateAPIKey(req, res, async (err) => {
      if (err && authHeader && authHeader.startsWith('Bearer ')) {
        // API key auth failed, try JWT
        const { authenticate } = await import('./auth.js');
        return authenticate(req, res, next);
      }
      if (err) return next(err);
      next();
    });
  }

  // Check for API key in Authorization header (ApiKey format)
  if (authHeader && authHeader.startsWith('ApiKey ')) {
    req.headers['x-api-key'] = authHeader.substring(7);
    return authenticateAPIKey(req, res, async (err) => {
      if (err && authHeader.startsWith('Bearer ')) {
        // API key auth failed, try JWT
        const { authenticate } = await import('./auth.js');
        return authenticate(req, res, next);
      }
      if (err) return next(err);
      next();
    });
  }

  // No API key found, try JWT
  const { authenticate } = await import('./auth.js');
  return authenticate(req, res, next);
}

