/**
 * Admin routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { getAllUsers, updateUserApproval } from '../database/users.js';
import { getMegaQR, getChildrenByMegaID } from '../fabric/client.js';
import { logger } from '../utils/logger.js';

export const adminRouter = Router();

// All routes require admin authentication
adminRouter.use(authenticate);
adminRouter.use(authorize('admin'));

// Get all users
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, approvalStatus } = req.query;
    const users = await getAllUsers({
      role: role as string,
      approvalStatus: approvalStatus as string,
    });

    res.json(users.map((user) => ({
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
    })));
  } catch (error: any) {
    logger.error('Error getting users:', error);
    res.status(500).json({ error: error.message || 'Failed to get users' });
  }
});

// Approve/reject user
adminRouter.post(
  '/users/:userId/approve',
  [body('approved').isBoolean(), body('rejectionReason').optional().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { approved, rejectionReason } = req.body;

      const user = await updateUserApproval(userId, approved, rejectionReason);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          approved: user.approved,
          approvalStatus: user.approvalStatus,
        },
      });
    } catch (error: any) {
      logger.error('Error updating user approval:', error);
      res.status(500).json({ error: error.message || 'Failed to update user approval' });
    }
  }
);

// Recall product
adminRouter.post(
  '/recall',
  [body('megaID').notEmpty().trim(), body('reason').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { megaID, reason } = req.body;
      const megaQR = await getMegaQR(megaID);

      if (!megaQR) {
        return res.status(404).json({ error: 'MegaQR not found' });
      }

      // In a real implementation, this would update the status on blockchain
      // For now, we'll just return success
      const children = await getChildrenByMegaID(megaID);

      logger.warn(`Product recall initiated: ${megaID} by admin ${req.user!.email}. Reason: ${reason}`);

      res.json({
        success: true,
        affectedChildren: children.length,
      });
    } catch (error: any) {
      logger.error('Error recalling product:', error);
      res.status(500).json({ error: error.message || 'Failed to recall product' });
    }
  }
);

