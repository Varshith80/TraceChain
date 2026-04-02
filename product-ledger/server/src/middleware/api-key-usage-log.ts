/**
 * API Key Usage Logging Middleware
 * 
 * Logs API key usage for analytics and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { APIKeyRequest } from './api-key-auth.js';
import { logAPIKeyUsage } from '../database/api-keys.js';
import { logger } from '../utils/logger.js';

/**
 * Log API key usage after request completes
 */
export function logAPIKeyUsageMiddleware(
  req: APIKeyRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.apiKey) {
    // Not using API key, skip
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // Capture response
  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log asynchronously (don't block response)
    logAPIKeyUsage(
      req.apiKey!.id,
      req.apiKey!.manufacturerId,
      req.path,
      req.method,
      req.ip,
      req.get('user-agent'),
      res.statusCode,
      responseTime
    ).catch(err => {
      logger.error('Failed to log API key usage (non-critical):', err);
    });

    return originalSend.call(this, body);
  };

  next();
}

