/**
 * Product Ledger Backend Server
 * Main entry point for the Express server with Hyperledger Fabric integration
 */


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, getCorsOptions, validateRequestSize } from './middleware/security.js';
import { globalRateLimiter } from './middleware/rate-limit.js';
import { auditLog } from './middleware/audit-log.js';
import { authRouter } from './routes/auth.js';
import { megaQRRouter } from './routes/megaQR.js';
import { childQRRouter } from './routes/childQR.js';
import { verifyRouter } from './routes/verify.js';
import { publicVerifyRouter } from './routes/public-verify.js';
import { auditRouter } from './routes/audit.js';
import { reportRouter } from './routes/report.js';
import { adminRouter } from './routes/admin.js';
import { apiKeyRouter } from './routes/api-keys.js';
import { initializeFabric, closeFabric } from './fabric/init.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables (project root .env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also allow server/.env override

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware (must be first)
app.use(securityHeaders);

// CORS configuration (production-ready)
app.use(cors(getCorsOptions()));

// Request size validation
app.use(validateRequestSize(parseInt(process.env.MAX_REQUEST_SIZE || '1048576'))); // 1MB default

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting
app.use(globalRateLimiter);

// Audit logging (for all requests)
app.use(auditLog);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'product-ledger-backend',
  });
});

// Public Routes (no authentication required)
app.use('/', publicVerifyRouter); // Public verification: GET /v/:childID

// API Routes (authentication required)
app.use('/api/auth', authRouter);
app.use('/api/api-keys', apiKeyRouter);
app.use('/api/mega', megaQRRouter);
app.use('/api/child', childQRRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/audit', auditRouter);
app.use('/api/report', reportRouter);
app.use('/api/admin', adminRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Fabric connection (required) - NO local database
    const useMock = process.env.FABRIC_USE_MOCK === 'true';
    if (useMock) {
      throw new Error('FABRIC_USE_MOCK=true is not allowed. Set FABRIC_USE_MOCK=false to use Hyperledger Fabric.');
    }

    logger.info('Initializing Hyperledger Fabric connection...');
    await initializeFabric();
    logger.info('Fabric connection initialized successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await closeFabric();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  gracefulShutdown();
});

startServer();

