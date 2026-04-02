/**
 * Audit Logging Middleware
 * Logs requests for security (no local DB - console only)
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { APIKeyRequest } from './api-key-auth.js';

export async function auditLog(
  req: APIKeyRequest,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;
    logger.debug('Audit', {
      action: `${req.method} ${req.path}`,
      status: res.statusCode,
      responseTimeMs: responseTime,
      userId: req.user?.id,
      ip: req.ip,
    });
    return originalSend.call(this, body);
  };

  next();
}


