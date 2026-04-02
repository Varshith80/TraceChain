# Production Deployment Checklist

## Pre-Deployment

## ✅ Security Configuration

- [ ] Generate all secrets using `scripts/generate-secrets.sh`
- [ ] Verify secrets are NOT in version control (check `.gitignore`)
- [ ] Set proper file permissions on secrets: `chmod 600 secrets/*.txt`
- [ ] Review and update `.env.production` with production values
- [ ] Verify no hardcoded credentials in Docker Compose files
- [ ] Review CORS origins for production domains
- [ ] Verify JWT secret is strong (at least 32 characters)
- [ ] Verify database passwords are strong

## ✅ Docker Configuration

- [ ] Production Docker Compose file exists (`docker-compose.production.yml`)
- [ ] Production Dockerfiles exist:
  - [ ] `server/Dockerfile.production`
  - [ ] `Dockerfile.frontend.production`
- [ ] All services use non-root users
- [ ] Health checks configured for all services
- [ ] Resource limits set appropriately
- [ ] Network isolation configured

## ✅ Application Configuration

- [ ] Environment variables documented in `.env.production.example`
- [ ] Fabric network configuration verified
- [ ] Database connection strings verified
- [ ] API endpoints configured correctly
- [ ] Frontend API URLs point to production backend
- [ ] Verification domain configured correctly

## ✅ Blockchain Verification

- [ ] Fabric network is running and healthy
- [ ] Chaincode is deployed and instantiated
- [ ] Channel is created and peers joined
- [ ] Fabric connection profile is correct
- [ ] TLS certificates are valid
- [ ] Event listener is enabled
- [ ] Mock mode is disabled (`FABRIC_USE_MOCK=false`)

## ✅ Database Setup

- [ ] PostgreSQL is running and healthy
- [ ] Database schema is created
- [ ] Read mirror tables exist
- [ ] Indexes are created
- [ ] Admin user is created
- [ ] Database backups configured

## ✅ Security Features

- [ ] Rate limiting configured
- [ ] API key authentication working
- [ ] Security headers (Helmet) enabled
- [ ] Request validation enabled
- [ ] Audit logging enabled
- [ ] CORS properly configured

## Deployment Steps

### 1. Generate Secrets

```bash
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh
```

### 2. Configure Environment

```bash
cp .env.production.example .env.production
# Edit .env.production with production values
```

### 3. Start Fabric Network

```bash
cd fabric-network
docker-compose -f docker-compose.production.yml up -d
```

### 4. Start Application Services

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 5. Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Check health endpoints
curl http://localhost:3001/health
```

### 6. Run Deployment Audit

```bash
node scripts/deployment-audit.js
```

## Post-Deployment Verification

## ✅ Functionality Tests

- [ ] User registration works
- [ ] User login works
- [ ] Admin can approve users
- [ ] Manufacturer can create MegaQR
- [ ] Manufacturer can generate ChildQRs
- [ ] Retailer can scan and commit messages
- [ ] Consumer can verify products
- [ ] Public verification endpoint works (`/v/:childID`)

## ✅ Security Tests

- [ ] API key authentication works
- [ ] Rate limiting works (test with multiple requests)
- [ ] Security headers are present
- [ ] CORS blocks unauthorized origins
- [ ] Audit logs are being written
- [ ] API key usage is logged

## ✅ Blockchain Tests

- [ ] Product data is written to Fabric
- [ ] Product data can be read from Fabric
- [ ] Event listener syncs to PostgreSQL
- [ ] Read mirror tables are populated
- [ ] Verification uses Fabric as source of truth

## ✅ Performance Tests

- [ ] Response times are acceptable
- [ ] Rate limits are enforced
- [ ] Database queries are optimized
- [ ] Read mirror provides fast reads

## ✅ Monitoring

- [ ] Health checks are working
- [ ] Logs are being collected
- [ ] Metrics are being tracked
- [ ] Alerts are configured

## Rollback Plan

If deployment fails:

1. Stop all services:
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. Restore from backup (if needed)

3. Review logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs
   ```

4. Fix issues

5. Redeploy when ready

## Maintenance

- [ ] Regular security updates
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] Secret rotation schedule
- [ ] Performance monitoring
- [ ] Security audits scheduled

