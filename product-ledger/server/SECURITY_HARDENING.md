# Production Security Hardening

## Overview

This document describes the production security hardening implemented for the Product Ledger backend.

## Security Features Implemented

### 1. API Key Authentication ✅

**Features**:
- API key generation per manufacturer
- Hashed storage (NOT plaintext)
- Rate limiting per key
- Usage logging
- Key revocation capability

**Storage**:
- API keys are hashed using bcrypt (12 rounds)
- Only key prefix (first 8 chars) stored for identification
- Plaintext key shown only once on creation

**Usage**:
```bash
# Header format
X-API-Key: pl_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Or Authorization header
Authorization: ApiKey pl_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Rate Limiting ✅

**Global Rate Limiting**:
- Default: 1000 requests per minute per IP
- Configurable via `RATE_LIMIT_GLOBAL_PER_MINUTE`

**Per API Key Rate Limiting**:
- Per minute: Default 100 (configurable)
- Per hour: Default 1000 (configurable)
- Per day: Default 10000 (configurable)

**Implementation**:
- In-memory store (use Redis in production)
- Automatic cleanup of expired entries
- Rate limit headers in response

### 3. Security Headers (Helmet) ✅

**Headers Set**:
- `Content-Security-Policy`: Restricts resource loading
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Controls referrer information

### 4. Request Validation ✅

**Features**:
- Input validation using express-validator
- Request size limits (1MB default)
- Type checking and sanitization
- Custom validation rules

**Implementation**:
- Middleware validates all inputs
- Returns detailed error messages
- Prevents injection attacks

### 5. Audit Logging ✅

**Features**:
- Logs all API requests
- Tracks user actions
- Records API key usage
- Stores request/response metadata

**Tables**:
- `audit_logs`: All API requests
- `api_key_usage_logs`: API key specific usage

**Fields Logged**:
- User ID / API Key ID
- Action (method + path)
- Resource type and ID
- IP address
- User agent
- Request/response data
- Response time
- Status code

### 6. CORS Tightening ✅

**Production Configuration**:
- Only allows configured origins
- Credentials enabled
- Specific methods allowed
- Custom headers exposed

**Development**:
- Allows all origins (for development)

**Configuration**:
```env
CORS_ORIGIN=https://app.productledger.com,https://verify.productledger.com
```

### 7. API Key Management ✅

**Routes**:
- `POST /api/api-keys` - Create API key
- `GET /api/api-keys` - List API keys
- `GET /api/api-keys/:id` - Get API key details
- `DELETE /api/api-keys/:id` - Revoke API key
- `PATCH /api/api-keys/:id/rate-limits` - Update rate limits

**Security**:
- Only manufacturers can create API keys
- Keys can only be accessed by owner or admin
- Revocation is immediate and permanent

## Environment Variables

```env
# Rate Limiting
RATE_LIMIT_GLOBAL_PER_MINUTE=1000
RATE_LIMIT_STRICT_MAX=10

# Request Size
MAX_REQUEST_SIZE=1048576

# CORS
CORS_ORIGIN=https://app.productledger.com,https://verify.productledger.com

# Security
NODE_ENV=production
```

## API Key Format

**Format**: `pl_<32_random_chars>`

**Example**: `pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Storage**:
- Full key: Hashed with bcrypt (12 rounds)
- Prefix: First 8 chars stored for identification

## Rate Limiting Headers

Response includes:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Usage Logging

All API key usage is logged to `api_key_usage_logs` table:
- Endpoint accessed
- Method used
- IP address
- User agent
- Status code
- Response time

## Audit Logging

All requests logged to `audit_logs` table:
- User/API key identification
- Action performed
- Resource accessed
- Request/response data
- Timestamps

**Sensitive Data**:
- Passwords, tokens, API keys are redacted
- Request bodies sanitized before logging

## Security Best Practices

1. **API Keys**:
   - Store securely (environment variables, secrets manager)
   - Rotate regularly
   - Revoke compromised keys immediately

2. **Rate Limiting**:
   - Monitor usage patterns
   - Adjust limits based on needs
   - Use Redis for distributed rate limiting in production

3. **Audit Logs**:
   - Review regularly
   - Monitor for suspicious activity
   - Retain logs per compliance requirements

4. **CORS**:
   - Only allow necessary origins
   - Review and update allowed origins regularly

5. **Headers**:
   - Keep Helmet configuration updated
   - Review CSP policies
   - Test security headers regularly

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` with production domains
- [ ] Set appropriate rate limits
- [ ] Enable Redis for distributed rate limiting
- [ ] Configure audit log retention
- [ ] Set up monitoring for security events
- [ ] Review and update security headers
- [ ] Test API key generation and revocation
- [ ] Verify rate limiting works correctly
- [ ] Test audit logging captures all events

## Monitoring

Monitor:
- API key usage patterns
- Rate limit violations
- Failed authentication attempts
- Audit log volume
- Response times
- Error rates

## Incident Response

If API key is compromised:
1. Revoke key immediately via API or database
2. Review audit logs for unauthorized access
3. Generate new API key
4. Update applications using old key
5. Monitor for suspicious activity

