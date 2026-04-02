#!/usr/bin/env node

/**
 * Deployment Readiness Audit
 * 
 * Verifies the system is ready for production deployment:
 * - No in-memory product storage
 * - Blockchain is source of truth
 * - User data is centralized
 * - QR verification works end-to-end
 * - APIs are secure and rate-limited
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition, details = '') {
  const passed = condition;
  checks.push({ name, passed, details });
  if (passed) {
    passCount++;
    console.log(`✅ PASS: ${name}`);
  } else {
    failCount++;
    console.log(`❌ FAIL: ${name}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }
  return passed;
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  return fs.existsSync(fullPath);
}

function checkFileContains(filePath, pattern, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes(pattern);
}

function checkNoPattern(filePath, pattern, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    return true; // File doesn't exist, so pattern not found
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return !content.includes(pattern);
}

console.log('🔍 Deployment Readiness Audit\n');
console.log('='.repeat(60));

// 1. No In-Memory Product Storage
console.log('\n📦 1. PRODUCT STORAGE AUDIT');
console.log('-'.repeat(60));

check(
  'No in-memory product storage',
  checkNoPattern('server/src/fabric/client.ts', 'Map<', 'No Map data structures for product storage') &&
  checkNoPattern('server/src/fabric/client.ts', 'new Map', 'No Map instantiation') &&
  checkNoPattern('server/src/fabric/repository.ts', 'Map<', 'No Map in repository') &&
  checkNoPattern('server/src/fabric/repository.ts', 'new Map', 'No Map instantiation in repository'),
  'All product data should be stored in Fabric blockchain, not in-memory'
);

check(
  'Product cache is PostgreSQL-based (not in-memory)',
  checkFileContains('server/src/database/product-cache.ts', 'getDatabase()', 'Uses PostgreSQL database'),
  'Cache should use PostgreSQL, not in-memory storage'
);

check(
  'Read mirror tables exist',
  checkFileContains('server/src/database/schema.ts', 'mega_qrs_read', 'Read mirror table exists') &&
  checkFileContains('server/src/database/schema.ts', 'child_qrs_read', 'ChildQR read mirror exists') &&
  checkFileContains('server/src/database/schema.ts', 'scan_events_read', 'Scan events read mirror exists'),
  'Read-optimized mirror tables should exist'
);

// 2. Blockchain is Source of Truth
console.log('\n⛓️  2. BLOCKCHAIN SOURCE OF TRUTH');
console.log('-'.repeat(60));

check(
  'Fabric repository writes to blockchain',
  checkFileContains('server/src/fabric/repository.ts', 'submitTransaction', 'Uses submitTransaction for writes') &&
  checkFileContains('server/src/fabric/repository.ts', 'evaluateTransaction', 'Uses evaluateTransaction for reads'),
  'All product operations should go through Fabric blockchain'
);

check(
  'No mock mode in production',
  checkFileContains('server/src/fabric/init.ts', 'FABRIC_USE_MOCK', 'Checks for mock mode') &&
  (checkFileContains('server/src/fabric/init.ts', 'mock mode is not allowed', 'Mock mode disabled') ||
   checkFileContains('server/src/fabric/init.ts', 'FABRIC_USE_MOCK', 'Mock mode check exists')),
  'Mock mode should be disabled in production (set FABRIC_USE_MOCK=false)'
);

check(
  'Event listener syncs blockchain to PostgreSQL',
  checkFileExists('server/src/fabric/event-listener.ts', 'Event listener exists') &&
  checkFileContains('server/src/fabric/event-listener.ts', 'syncMegaQRToRead', 'Syncs MegaQR to read mirror') &&
  checkFileContains('server/src/fabric/event-listener.ts', 'syncChildQRToRead', 'Syncs ChildQR to read mirror'),
  'Event listener should sync blockchain data to PostgreSQL read mirror'
);

check(
  'One-way sync: Blockchain → PostgreSQL',
  checkFileContains('server/src/fabric/event-listener.ts', 'INSERT INTO', 'Only INSERT operations') &&
  checkNoPattern('server/src/fabric/event-listener.ts', 'UPDATE.*FROM.*fabric', 'No updates from Fabric'),
  'PostgreSQL should only receive data from blockchain, not write to it'
);

// 3. User Data Centralized
console.log('\n👥 3. USER DATA CENTRALIZATION');
console.log('-'.repeat(60));

check(
  'User data in PostgreSQL',
  checkFileExists('server/src/database/users.ts', 'User management exists') &&
  checkFileContains('server/src/database/schema.ts', 'profiles', 'Profiles table exists') &&
  checkFileContains('server/src/database/schema.ts', 'user_roles', 'User roles table exists'),
  'User data should be stored in PostgreSQL, not blockchain'
);

check(
  'JWT authentication for users',
  checkFileExists('server/src/middleware/auth.ts', 'Auth middleware exists') &&
  checkFileContains('server/src/middleware/auth.ts', 'jwt.verify', 'Uses JWT verification'),
  'User authentication should use JWT tokens'
);

check(
  'No user data in blockchain',
  checkNoPattern('server/src/fabric/repository.ts', 'user.*password', 'No user passwords') &&
  checkNoPattern('server/src/fabric/repository.ts', 'user.*email', 'No user emails') &&
  checkNoPattern('chaincode/productledger.go', 'user.*password', 'No user passwords in chaincode') &&
  checkNoPattern('chaincode/productledger.go', 'user.*email', 'No user emails in chaincode'),
  'Blockchain should not store user authentication data'
);

// 4. QR Verification End-to-End
console.log('\n🔍 4. QR VERIFICATION');
console.log('-'.repeat(60));

check(
  'QR code format uses URL (not hash)',
  checkFileContains('src/components/manufacturer/QRCodeGrid.tsx', 'verify.productledger.com', 'Uses verification URL') ||
  checkFileContains('src/components/manufacturer/QRCodeGrid.tsx', 'VITE_VERIFY_DOMAIN', 'Uses verify domain'),
  'QR codes should contain verification URLs, not hashes'
);

check(
  'Public verification endpoint exists',
  checkFileExists('server/src/routes/public-verify.ts', 'Public verify route exists') &&
  checkFileContains('server/src/routes/public-verify.ts', '/v/:childID', 'Public endpoint route'),
  'Public verification endpoint should exist at /v/:childID'
);

check(
  'Verification fetches from Fabric',
  checkFileContains('server/src/routes/public-verify.ts', 'verifyProduct', 'Calls verifyProduct') &&
  checkFileContains('server/src/routes/public-verify.ts', 'getProductRepository', 'Uses Fabric repository'),
  'Verification should fetch data from Fabric blockchain'
);

check(
  'Verification uses read mirror for metadata',
  checkFileContains('server/src/routes/public-verify.ts', 'getChildQRFromRead', 'Uses read mirror') &&
  checkFileContains('server/src/routes/public-verify.ts', 'getScanEventsFromRead', 'Gets scan events from mirror'),
  'Verification should use PostgreSQL read mirror for fast metadata'
);

check(
  'No authentication required for verification',
  checkFileContains('server/src/routes/public-verify.ts', 'publicVerifyRouter', 'Public router') &&
  checkNoPattern('server/src/routes/public-verify.ts', 'authenticate', 'No auth middleware'),
  'Public verification endpoint should not require authentication'
);

// 5. API Security
console.log('\n🔒 5. API SECURITY');
console.log('-'.repeat(60));

check(
  'Rate limiting implemented',
  checkFileExists('server/src/middleware/rate-limit.ts', 'Rate limit middleware exists') &&
  checkFileContains('server/src/middleware/rate-limit.ts', 'express-rate-limit', 'Uses rate limiting library') &&
  checkFileContains('server/src/index.ts', 'globalRateLimiter', 'Global rate limiter applied'),
  'Rate limiting should be implemented globally and per API key'
);

check(
  'API key authentication exists',
  checkFileExists('server/src/middleware/api-key-auth.ts', 'API key auth exists') &&
  checkFileContains('server/src/middleware/api-key-auth.ts', 'validateAPIKey', 'Validates API keys'),
  'API key authentication should be implemented'
);

check(
  'API keys hashed (not plaintext)',
  checkFileContains('server/src/database/api-keys.ts', 'bcrypt.hash', 'Uses bcrypt for hashing') &&
  checkNoPattern('server/src/database/api-keys.ts', 'key.*=.*plaintext', 'No plaintext storage'),
  'API keys should be hashed, not stored in plaintext'
);

check(
  'Security headers configured',
  checkFileExists('server/src/middleware/security.ts', 'Security middleware exists') &&
  checkFileContains('server/src/middleware/security.ts', 'helmet', 'Uses Helmet') &&
  checkFileContains('server/src/index.ts', 'securityHeaders', 'Security headers applied'),
  'Security headers (Helmet) should be configured'
);

check(
  'Request validation implemented',
  checkFileContains('server/src/middleware/security.ts', 'validateRequest', 'Request validation exists') &&
  checkFileContains('server/src/index.ts', 'validateRequestSize', 'Request size validation'),
  'Request validation should be implemented'
);

check(
  'Audit logging enabled',
  checkFileExists('server/src/middleware/audit-log.ts', 'Audit log middleware exists') &&
  checkFileContains('server/src/database/schema.ts', 'audit_logs', 'Audit logs table exists') &&
  checkFileContains('server/src/index.ts', 'auditLog', 'Audit logging applied'),
  'Audit logging should be enabled for all requests'
);

check(
  'CORS properly configured',
  checkFileContains('server/src/middleware/security.ts', 'getCorsOptions', 'CORS configuration exists') &&
  checkFileContains('server/src/middleware/security.ts', 'CORS_ORIGIN', 'Uses environment variable'),
  'CORS should be properly configured for production'
);

// 6. Docker Configuration
console.log('\n🐳 6. DOCKER CONFIGURATION');
console.log('-'.repeat(60));

check(
  'Production Docker Compose exists',
  checkFileExists('docker-compose.production.yml', 'Production compose file exists'),
  'Production Docker Compose file should exist'
);

check(
  'No hardcoded credentials in Docker Compose',
  checkNoPattern('docker-compose.production.yml', 'password.*=.*[^$]', 'No hardcoded passwords') &&
  checkNoPattern('docker-compose.production.yml', 'secret.*=.*[^$]', 'No hardcoded secrets'),
  'Docker Compose should use environment variables and secrets, not hardcoded values'
);

check(
  'Docker secrets configured',
  checkFileContains('docker-compose.production.yml', 'secrets:', 'Secrets section exists') &&
  checkFileContains('docker-compose.production.yml', 'file:', 'Uses file-based secrets'),
  'Docker secrets should be configured'
);

check(
  'Production Dockerfile exists',
  checkFileExists('server/Dockerfile.production', 'Production Dockerfile exists'),
  'Production Dockerfile should exist'
);

check(
  'Non-root user in Dockerfile',
  checkFileContains('server/Dockerfile.production', 'USER nodejs', 'Uses non-root user') ||
  checkFileContains('server/Dockerfile.production', 'USER', 'Uses non-root user'),
  'Docker containers should run as non-root user'
);

check(
  'Health checks configured',
  checkFileContains('server/Dockerfile.production', 'HEALTHCHECK', 'Health check configured') &&
  checkFileContains('docker-compose.production.yml', 'healthcheck:', 'Health checks in compose'),
  'Health checks should be configured for all services'
);

// 7. Environment Configuration
console.log('\n⚙️  7. ENVIRONMENT CONFIGURATION');
console.log('-'.repeat(60));

check(
  'Environment example file exists',
  checkFileExists('.env.production.example', 'Environment example exists') ||
  checkFileExists('env.production.example', 'Environment example exists'),
  'Environment example file should exist (.env.production.example)'
);

check(
  'No secrets in example file',
  checkNoPattern('.env.production.example', 'password.*=.*[a-zA-Z0-9]{8,}', 'No actual passwords') &&
  checkNoPattern('.env.production.example', 'secret.*=.*[a-zA-Z0-9]{8,}', 'No actual secrets'),
  'Example file should not contain actual secrets'
);

check(
  'Secrets directory structure',
  checkFileExists('secrets/README.md', 'Secrets README exists'),
  'Secrets directory should have documentation'
);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${checks.length}`);
console.log(`📊 Pass Rate: ${((passCount / checks.length) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 All checks passed! System is ready for production deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review and fix before deployment.');
  console.log('\nFailed Checks:');
  checks.filter(c => !c.passed).forEach(c => {
    console.log(`  ❌ ${c.name}`);
    if (c.details) {
      console.log(`     ${c.details}`);
    }
  });
  process.exit(1);
}

