# Deployment Guide

This guide covers deploying Product Ledger to production.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Node.js 20+ (for building)
- Hyperledger Fabric network (optional, can use mock mode)

## Production Deployment Steps

### 1. Environment Configuration

#### Backend Environment Variables

Create `server/.env` with production values:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@host:5432/product_ledger_users
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_PEER_ENDPOINT=your-fabric-peer:7051
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

#### Frontend Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. Database Setup

#### Option A: Using Docker

```bash
docker run -d \
  --name product-ledger-db \
  --restart unless-stopped \
  -e POSTGRES_USER=productledger \
  -e POSTGRES_PASSWORD=<strong-password> \
  -e POSTGRES_DB=product_ledger_users \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Option B: Managed PostgreSQL

Use a managed PostgreSQL service (AWS RDS, Azure Database, etc.) and update `DATABASE_URL`.

### 3. Build and Deploy

#### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Manual Deployment

**Backend:**
```bash
cd server
npm install --production
npm run build
npm start
```

**Frontend:**
```bash
npm install
npm run build
# Deploy dist/ folder to your web server (nginx, Apache, etc.)
```

### 4. Nginx Configuration (Frontend)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/product-ledger/dist;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Hyperledger Fabric Setup

#### Development (Mock Mode)

Set `FABRIC_USE_MOCK=true` in `server/.env`. This uses an in-memory store instead of a real blockchain.

#### Production (Real Fabric Network)

1. Set up Hyperledger Fabric network
2. Deploy chaincode from `chaincode/` directory
3. Configure connection profile
4. Set `FABRIC_USE_MOCK=false`
5. Configure Fabric connection details in `server/.env`

### 6. Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Review and update dependencies
- [ ] Enable database SSL connections

### 7. Monitoring

#### Health Checks

- Backend: `GET http://your-api-domain/health`
- Frontend: Check if index.html loads

#### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres
```

### 8. Backup Strategy

#### Database Backups

```bash
# Manual backup
docker exec product-ledger-db pg_dump -U productledger product_ledger_users > backup.sql

# Automated backup (cron)
0 2 * * * docker exec product-ledger-db pg_dump -U productledger product_ledger_users > /backups/product_ledger_$(date +\%Y\%m\%d).sql
```

### 9. Scaling

#### Horizontal Scaling

- Use load balancer for multiple backend instances
- Use shared PostgreSQL database
- Use shared session store (Redis) if needed

#### Vertical Scaling

- Increase database resources
- Increase backend server resources
- Optimize database queries

### 10. Troubleshooting

#### Backend won't start
- Check database connection
- Verify environment variables
- Check logs: `docker-compose logs backend`

#### Frontend can't connect to API
- Verify `VITE_API_URL` is correct
- Check CORS configuration
- Verify backend is running

#### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Verify user permissions

## Support

For deployment issues, please open an issue in the repository.

