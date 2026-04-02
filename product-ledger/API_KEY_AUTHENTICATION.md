# API Key Authentication Guide

## Overview

API key authentication allows manufacturers to authenticate API requests without using JWT tokens. This is useful for:
- Server-to-server communication
- Automated systems
- Integration with external services
- Long-lived authentication

## Features

✅ **Secure Storage**: API keys are hashed (NOT stored in plaintext)
✅ **Rate Limiting**: Per-key rate limits (per minute/hour/day)
✅ **Usage Logging**: All API key usage is logged
✅ **Revocation**: Keys can be revoked immediately
✅ **Expiration**: Optional expiration dates

## Creating API Keys

### Via API

```bash
POST /api/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Production API Key",
  "description": "API key for production integration",
  "rateLimitPerMinute": 100,
  "rateLimitPerHour": 1000,
  "rateLimitPerDay": 10000,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "success": true,
  "apiKey": {
    "id": "uuid",
    "keyPrefix": "pl_a1b2",
    "name": "Production API Key",
    "rateLimitPerMinute": 100,
    "rateLimitPerHour": 1000,
    "rateLimitPerDay": 10000,
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "plaintextKey": "pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "warning": "Store this API key securely. It will not be shown again."
}
```

⚠️ **Important**: The plaintext key is only shown once. Store it securely!

## Using API Keys

### Header Format

```bash
# Option 1: X-API-Key header
X-API-Key: pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Option 2: Authorization header
Authorization: ApiKey pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Example Request

```bash
curl -X GET https://api.productledger.com/api/mega \
  -H "X-API-Key: pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### JavaScript Example

```javascript
const response = await fetch('https://api.productledger.com/api/mega', {
  headers: {
    'X-API-Key': 'pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    'Content-Type': 'application/json',
  },
});
```

## Managing API Keys

### List API Keys

```bash
GET /api/api-keys
Authorization: Bearer <jwt_token>
```

### Get API Key Details

```bash
GET /api/api-keys/:id
Authorization: Bearer <jwt_token>
```

### Revoke API Key

```bash
DELETE /api/api-keys/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Key compromised"
}
```

### Update Rate Limits

```bash
PATCH /api/api-keys/:id/rate-limits
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "rateLimitPerMinute": 200,
  "rateLimitPerHour": 2000,
  "rateLimitPerDay": 20000
}
```

## Rate Limiting

### Default Limits

- **Per Minute**: 100 requests
- **Per Hour**: 1,000 requests
- **Per Day**: 10,000 requests

### Rate Limit Headers

Response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### Rate Limit Exceeded

When rate limit is exceeded:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Limit: 100 requests per minute.",
  "retryAfter": 60
}
```

## Usage Logging

All API key usage is automatically logged:
- Endpoint accessed
- HTTP method
- IP address
- User agent
- Status code
- Response time

Query usage logs:
```sql
SELECT * FROM api_key_usage_logs 
WHERE api_key_id = 'uuid' 
ORDER BY created_at DESC;
```

## Security Best Practices

1. **Store Securely**:
   - Use environment variables
   - Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Never commit to version control

2. **Rotate Regularly**:
   - Rotate keys every 90 days
   - Revoke old keys after rotation

3. **Monitor Usage**:
   - Review usage logs regularly
   - Watch for unusual patterns
   - Set up alerts for rate limit violations

4. **Revoke Immediately**:
   - If key is compromised
   - If key is no longer needed
   - If employee leaves

5. **Use Least Privilege**:
   - Create separate keys for different services
   - Use different rate limits per service
   - Revoke unused keys

## API Key vs JWT

| Feature | API Key | JWT Token |
|---------|---------|-----------|
| Lifetime | Long-lived | Short-lived (7 days) |
| Storage | Hashed | Signed |
| Revocation | Immediate | Wait for expiration |
| Rate Limiting | Per key | Per user |
| Usage Logging | Detailed | Basic |
| Best For | Server-to-server | User sessions |

## Troubleshooting

### Invalid API Key

**Error**: `401 Invalid API key`

**Solutions**:
- Verify key is correct (no extra spaces)
- Check key hasn't been revoked
- Verify key hasn't expired
- Ensure manufacturer account is approved

### Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solutions**:
- Wait for rate limit window to reset
- Request rate limit increase
- Implement request batching
- Use multiple API keys for load distribution

### Key Not Found

**Error**: `404 API key not found`

**Solutions**:
- Verify key ID is correct
- Check key belongs to your account
- Ensure you have permission to access key

## Migration from JWT

If you're currently using JWT tokens:

1. Create API key via `/api/api-keys`
2. Store API key securely
3. Update requests to use `X-API-Key` header
4. Test thoroughly
5. Keep JWT as fallback if needed

## Examples

### Create MegaQR with API Key

```bash
curl -X POST https://api.productledger.com/api/mega \
  -H "X-API-Key: pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Product",
    "batchNo": "BATCH001",
    "mfgDate": "2024-01-01",
    "expiryDate": "2025-01-01"
  }'
```

### Get Manufacturer MegaQRs

```bash
curl -X GET https://api.productledger.com/api/mega \
  -H "X-API-Key: pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

## Support

For issues or questions:
- Check audit logs for detailed error information
- Review rate limit headers in responses
- Contact support with API key prefix (first 8 chars)

