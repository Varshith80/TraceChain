# Product Ledger - Complete Startup Script for Windows
# This script will start the entire system step by step

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Product Ledger - Complete Startup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and start it, then run this script again." -ForegroundColor Red
    exit 1
}

# Step 1: Start Fabric Network
Write-Host ""
Write-Host "STEP 1: Starting Hyperledger Fabric Network..." -ForegroundColor Cyan
Write-Host ""

Set-Location fabric-network

# Check if crypto material exists
if (-not (Test-Path "crypto-config")) {
    Write-Host "Generating crypto material..." -ForegroundColor Yellow
    
    # Generate crypto material using Docker
    docker run --rm -v ${PWD}:/data hyperledger/fabric-tools:2.5 cryptogen generate --config=/data/crypto-config.yaml --output=/data/crypto-config
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to generate crypto material" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Crypto material generated" -ForegroundColor Green
}

# Check if channel artifacts exist
if (-not (Test-Path "channel-artifacts")) {
    New-Item -ItemType Directory -Path "channel-artifacts" -Force | Out-Null
}

if (-not (Test-Path "channel-artifacts/genesis.block")) {
    Write-Host "Generating genesis block..." -ForegroundColor Yellow
    
    docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock /data/channel-artifacts/genesis.block
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to generate genesis block" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Genesis block generated" -ForegroundColor Green
}

if (-not (Test-Path "channel-artifacts/productledger-channel.tx")) {
    Write-Host "Creating channel transaction..." -ForegroundColor Yellow
    
    docker run --rm -v ${PWD}:/data -e FABRIC_CFG_PATH=/data hyperledger/fabric-tools:2.5 configtxgen -profile TwoOrgsChannel -outputCreateChannelTx /data/channel-artifacts/productledger-channel.tx -channelID productledger-channel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to create channel transaction" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Channel transaction created" -ForegroundColor Green
}

# Start Fabric network
Write-Host "Starting Fabric containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start Fabric network" -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for Fabric network to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if containers are running
$fabricContainers = docker-compose ps --format json | ConvertFrom-Json
$runningCount = ($fabricContainers | Where-Object { $_.State -eq "running" }).Count

Write-Host "✓ Fabric network started ($runningCount containers running)" -ForegroundColor Green

Set-Location ..

# Step 2: Create Environment Files
Write-Host ""
Write-Host "STEP 2: Creating environment files..." -ForegroundColor Cyan

# Backend .env
if (-not (Test-Path "server/.env")) {
    $backendEnv = @"
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users
FABRIC_USE_MOCK=false
FABRIC_CHANNEL_NAME=productledger-channel
FABRIC_CHAINCODE_NAME=productledger
FABRIC_CONNECTION_PROFILE=../fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_IDENTITY_LABEL=appUser
FABRIC_AS_LOCALHOST=true
FABRIC_ENABLE_EVENT_LISTENER=true
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
"@
    $backendEnv | Out-File -FilePath "server/.env" -Encoding utf8
    Write-Host "✓ Created server/.env" -ForegroundColor Green
} else {
    Write-Host "✓ server/.env already exists" -ForegroundColor Green
}

# Frontend .env
if (-not (Test-Path ".env")) {
    $frontendEnv = @"
VITE_API_URL=http://localhost:3001/api
VITE_VERIFY_DOMAIN=localhost:8080
VITE_VERIFY_PROTOCOL=http
"@
    $frontendEnv | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✓ Created .env" -ForegroundColor Green
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}

# Step 3: Start Application Services
Write-Host ""
Write-Host "STEP 3: Starting application services..." -ForegroundColor Cyan

Write-Host "Starting PostgreSQL, Backend, and Frontend..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start application services" -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 4: Verify Services
Write-Host ""
Write-Host "STEP 4: Verifying services..." -ForegroundColor Cyan

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker ps --filter "name=product-ledger-db" --format "{{.Status}}"
if ($pgStatus -like "*Up*") {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running" -ForegroundColor Red
}

# Check Backend
Write-Host "Checking Backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ Backend is running and healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend returned status code: $($healthResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Backend is not responding (may still be starting)" -ForegroundColor Yellow
    Write-Host "  Check logs with: docker logs product-ledger-backend" -ForegroundColor Yellow
}

# Check Frontend
Write-Host "Checking Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend is not responding (may still be starting)" -ForegroundColor Yellow
    Write-Host "  Check logs with: docker logs product-ledger-frontend" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Startup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  • Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  • Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  • Backend Health: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:8080 in your browser" -ForegroundColor White
Write-Host "  2. Create an admin account or login" -ForegroundColor White
Write-Host "  3. Check logs if services are not responding:" -ForegroundColor White
Write-Host "     docker logs product-ledger-backend" -ForegroundColor Gray
Write-Host "     docker logs product-ledger-frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host "  cd fabric-network && docker-compose down" -ForegroundColor White
Write-Host ""

