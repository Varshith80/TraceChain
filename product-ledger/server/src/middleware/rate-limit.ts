/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting:
 * - Global rate limiting
 * - Per API key rate limiting
 * - Configurable limits
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { APIKeyRequest } from './api-key-auth.js';
import { logAPIKeyUsage } from '../database/api-keys.js';
import { logger } from '../utils/logger.js';
import { createError } from './errorHandler.js';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Global rate limiter (applies to all requests)
 */
export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_PER_MINUTE || '1000'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Global rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Global rate limit exceeded. Please try again later.',
      retryAfter: 60,
    });
  },
});

/**
 * Per API key rate limiter
 */
export async function apiKeyRateLimiter(
  req: APIKeyRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.apiKey) {
    // Not using API key, skip
    return next();
  }

  const apiKeyId = req.apiKey.id;
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);

  // Check per-minute limit
  const minuteKey = `api:${apiKeyId}:minute:${minute}`;
  const minuteData = rateLimitStore.get(minuteKey) || { count: 0, resetTime: (minute + 1) * 60000 };
  
  if (minuteData.count >= req.apiKey.rateLimitPerMinute) {
    logger.warn(`API key rate limit (per minute) exceeded: ${req.apiKey.keyPrefix}`);
    await logAPIKeyUsage(
      apiKeyId,
      req.apiKey.manufacturerId,
      req.path,
      req.method,
      req.ip,
      req.get('user-agent'),
      429,
      undefined
    );
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Limit: ${req.apiKey.rateLimitPerMinute} requests per minute.`,
      retryAfter: 60,
    });
  }

  // Check per-hour limit
  const hourKey = `api:${apiKeyId}:hour:${hour}`;
  const hourData = rateLimitStore.get(hourKey) || { count: 0, resetTime: (hour + 1) * 3600000 };
  
  if (hourData.count >= req.apiKey.rateLimitPerHour) {
    logger.warn(`API key rate limit (per hour) exceeded: ${req.apiKey.keyPrefix}`);
    await logAPIKeyUsage(
      apiKeyId,
      req.apiKey.manufacturerId,
      req.path,
      req.method,
      req.ip,
      req.get('user-agent'),
      429,
      undefined
    );
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Limit: ${req.apiKey.rateLimitPerHour} requests per hour.`,
      retryAfter: 3600,
    });
  }

  // Check per-day limit
  const dayKey = `api:${apiKeyId}:day:${day}`;
  const dayData = rateLimitStore.get(dayKey) || { count: 0, resetTime: (day + 1) * 86400000 };
  
  if (dayData.count >= req.apiKey.rateLimitPerDay) {
    logger.warn(`API key rate limit (per day) exceeded: ${req.apiKey.keyPrefix}`);
    await logAPIKeyUsage(
      apiKeyId,
      req.apiKey.manufacturerId,
      req.path,
      req.method,
      req.ip,
      req.get('user-agent'),
      429,
      undefined
    );
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Limit: ${req.apiKey.rateLimitPerDay} requests per day.`,
      retryAfter: 86400,
    });
  }

  // Increment counters
  minuteData.count++;
  hourData.count++;
  dayData.count++;
  rateLimitStore.set(minuteKey, minuteData);
  rateLimitStore.set(hourKey, hourData);
  rateLimitStore.set(dayKey, dayData);

  next();
}

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '10'),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

