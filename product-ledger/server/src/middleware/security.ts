/**
 * Security Middleware
 * 
 * Production security hardening:
 * - Helmet for security headers
 * - Request validation
 * - CORS tightening
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { createError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Helmet security headers configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny',
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Request validation middleware
 */
export function validateRequest(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Request validation failed: ${req.path}`, errors.array());
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array(),
      });
    }

    next();
  };
}

/**
 * CORS configuration (production-ready)
 */
export function getCorsOptions() {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (isDevelopment) {
        return callback(null, true);
      }

      // In production, check against allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Request size limit validation
 */
export function validateRequestSize(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');

    if (contentLength > maxSize) {
      logger.warn(`Request too large: ${contentLength} bytes from ${req.ip}`);
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds maximum size of ${maxSize} bytes`,
      });
    }

    next();
  };
}

/**
 * IP whitelist middleware (optional)
 */
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      // No whitelist configured, allow all
      return next();
    }

    const clientIP = req.ip || req.socket.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return next();
    }

    logger.warn(`IP not whitelisted: ${clientIP}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP address is not authorized',
    });
  };
}

