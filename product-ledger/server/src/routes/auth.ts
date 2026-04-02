/**
 * Authentication routes
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { createUser, verifyPassword, getUserByEmail, ensureConsumerFromOAuth } from '../database/users.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export const authRouter = Router();

// Sign up
authRouter.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').optional().trim(),
    body('companyName').optional().trim(),
    body('gstNumber').optional().trim(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('role').isIn(['admin', 'manufacturer', 'retailer', 'consumer']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, companyName, gstNumber, phone, address, role } = req.body;

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user
      const user = await createUser({
        email,
        password,
        fullName,
        companyName,
        gstNumber,
        phone,
        address,
        role,
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw createError(500, 'Server configuration error');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        } as jwt.SignOptions
      );

      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          companyName: user.companyName,
          role: user.role,
          approved: user.approved,
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    } catch (error: any) {
      logger.error('Signup error:', error);
      return res.status(500).json({ error: error.message || 'Failed to create account' });
    }
  }
);

// Sign in
authRouter.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Verify password
      const user = await verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw createError(500, 'Server configuration error');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        } as jwt.SignOptions
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          companyName: user.companyName,
          role: user.role,
          approved: user.approved,
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    } catch (error: any) {
      logger.error('Signin error:', error);
      res.status(500).json({ error: error.message || 'Failed to sign in' });
    }
  }
);

// Google OAuth callback - exchange Supabase access token for our JWT (consumers only)
authRouter.post(
  '/google',
  [body('accessToken').notEmpty().trim()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { accessToken } = req.body;

      const { getSupabase } = await import('../lib/supabase.js');
      const supabase = getSupabase();
      const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);

      if (error || !authUser) {
        return res.status(401).json({ error: 'Invalid or expired Google sign-in' });
      }

      const user = await ensureConsumerFromOAuth(
        authUser.id,
        authUser.email!,
        authUser.user_metadata?.full_name || authUser.user_metadata?.name
      );

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw createError(500, 'Server configuration error');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          companyName: user.companyName,
          role: user.role,
          approved: user.approved,
          approvalStatus: user.approvalStatus,
        },
        token,
      });
    } catch (error: any) {
      logger.error('Google auth error:', error);
      res.status(500).json({ error: error.message || 'Google sign-in failed' });
    }
  }
);

// Get current user
authRouter.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      gstNumber: user.gstNumber,
      phone: user.phone,
      address: user.address,
      role: user.role,
      approved: user.approved,
      approvalStatus: user.approvalStatus,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

