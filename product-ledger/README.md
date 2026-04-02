# Product Ledger - Blockchain Supply Chain Management

A production-ready blockchain-based product traceability system built with React/TypeScript frontend, Node.js/Express backend, and Hyperledger Fabric blockchain integration.

## 🎯 Overview

Product Ledger is a comprehensive supply chain management application that ensures authenticity, transparency, and tamper-proof tracking of products across manufacturers, retailers, and consumers. The system leverages Hyperledger Fabric as a decentralized ledger for recording immutable product lifecycle events while maintaining a centralized identity and administration layer for secure user management.

## 🏗️ Architecture

### Frontend
- **Technology:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Port:** 8080 (development), 80 (production)

### Backend
- **Technology:** Node.js + Express + TypeScript
- **Port:** 3001
- **Database:** PostgreSQL (for user management)
- **Blockchain:** Hyperledger Fabric (for product data)

### Blockchain Network
- **Technology:** Hyperledger Fabric 2.5
- **Organizations:** 2 (Org1, Org2)
- **Channel:** productledger-channel
- **Ordering:** Raft (etcdraft)
- **State Database:** CouchDB
- **TLS:** Enabled
- **Location:** `fabric-network/` directory

### Key Features
- ✅ Multi-role system (Admin, Manufacturer, Retailer, Consumer)
- ✅ QR code generation and tracking
- ✅ MegaQR (batch) and ChildQR (individual unit) management
- ✅ Immutable message commits to blockchain
- ✅ Product verification and counterfeit detection
- ✅ Audit logging and reporting
- ✅ Admin approval workflow

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product-ledger
   ```

2. **Set up environment variables**
   ```bash
   # Frontend
   cp .env.example .env
   
   # Backend
   cd server
   cp .env.example .env
   # Edit server/.env with your configuration
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb product_ledger_users
   
   # Or use Docker
   docker run -d \
     --name product-ledger-db \
     -e POSTGRES_USER=productledger \
     -e POSTGRES_PASSWORD=productledger123 \
     -e POSTGRES_DB=product_ledger_users \
     -p 5432:5432 \
     postgres:15-alpine
   ```

4. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd server
   npm install
   ```

5. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

6. **Start the frontend**
   ```bash
   npm run dev
   ```

7. **Set up Hyperledger Fabric network** (optional, for production)
   ```bash
   cd fabric-network
   chmod +x scripts/*.sh
   ./scripts/network-setup.sh
   docker-compose up -d
   ./scripts/deploy-channel.sh
   ./scripts/deploy-chaincode.sh
   ```
   See `fabric-network/QUICK_START.md` for detailed instructions.

8. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
product-ledger/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Route pages
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   └── types/              # TypeScript types
│
├── server/                 # Backend server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── database/       # Database operations
│   │   ├── fabric/         # Hyperledger Fabric integration
│   │   └── middleware/     # Express middleware
│   └── package.json
│
├── chaincode/              # Hyperledger Fabric chaincode (Go)
│   └── productledger.go
│
└── docker-compose.yml      # Docker Compose configuration
```

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@productledger.com`
- Password: `admin123` (⚠️ Change this in production!)

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/product_ledger_users

# Hyperledger Fabric
FABRIC_USE_MOCK=true  # Set to false for real Fabric network
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=productledger

# CORS
CORS_ORIGIN=http://localhost:8080
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3001/api
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user

### MegaQR (Manufacturer)
- `POST /api/mega` - Create MegaQR
- `GET /api/mega/:megaID` - Get MegaQR by ID
- `GET /api/mega?manufacturerID=:id` - Get manufacturer's MegaQRs
- `POST /api/mega/:megaID/generate-children` - Generate ChildQRs
- `POST /api/mega/:megaID/commit` - Commit message to MegaQR
- `GET /api/mega/:megaID/children` - Get children by MegaID

### ChildQR
- `GET /api/child/:childID` - Get ChildQR by ID
- `POST /api/child/:childID/commit` - Commit message to ChildQR

### Verification
- `GET /api/verify/:childID` - Verify ChildQR authenticity

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:userId/approve` - Approve/reject user
- `POST /api/admin/recall` - Recall product

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
npm test
```

## 🚢 Production Deployment

1. **Set production environment variables**
2. **Build frontend**
   ```bash
   npm run build
   ```
3. **Build backend**
   ```bash
   cd server
   npm run build
   ```
4. **Deploy using Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🔒 Security Considerations

- Change default admin password
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Configure proper CORS origins
- Set up Hyperledger Fabric network with proper certificates
- Enable database backups
- Implement rate limiting
- Add input validation and sanitization

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For support, email support@productledger.com or open an issue in the repository.

---

**Built with ❤️ for transparent and secure supply chain management**
