/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user info to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../database/users.js';
import { createError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    approved: boolean;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'No authentication token provided');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      throw createError(500, 'Server configuration error');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Get user from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      throw createError(401, 'User not found');
    }

    if (!user.approved && user.role !== 'consumer') {
      throw createError(403, 'Account pending approval');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      approved: user.approved,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired'));
    }
    next(error);
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError(403, 'Insufficient permissions'));
    }

    next();
  };
}

