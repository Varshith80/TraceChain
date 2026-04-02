# Product Ledger - Complete Startup Script WITH Hyperledger Fabric
# Run this script to start the entire project including Fabric network

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Product Ledger - Starting WITH Fabric" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Step 2: Setup Fabric Network (if not already done)
Write-Host "[2/7] Setting up Hyperledger Fabric Network..." -ForegroundColor Yellow
cd fabric-network

# Check if crypto material exists
if (-not (Test-Path "crypto-config/ordererOrganizations")) {
    Write-Host "⏳ Generating Fabric network artifacts (this may take 2-3 minutes)..." -ForegroundColor Yellow
    if (Test-Path "scripts/network-setup.sh") {
        # On Windows, we need to use WSL or Git Bash
        Write-Host "⚠️  Please run this in Git Bash or WSL:" -ForegroundColor Yellow
        Write-Host "   cd fabric-network" -ForegroundColor White
        Write-Host "   bash scripts/network-setup.sh" -ForegroundColor White
        Write-Host ""
        Write-Host "Or manually run:" -ForegroundColor Yellow
        Write-Host "   bash scripts/generate-crypto.sh" -ForegroundColor White
        Write-Host "   bash scripts/generate-genesis.sh" -ForegroundColor White
        Write-Host "   bash scripts/generate-anchor-peers.sh" -ForegroundColor White
        cd ..
        exit 1
    }
} else {
    Write-Host "✅ Fabric crypto material already exists" -ForegroundColor Green
}

# Start Fabric network
Write-Host "⏳ Starting Fabric network containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Fabric network" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "⏳ Waiting for Fabric network to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if channel exists
$channelExists = docker exec cli peer channel list 2>$null | Select-String "productledger-channel"
if (-not $channelExists) {
    Write-Host "⏳ Creating and joining channel..." -ForegroundColor Yellow
    if (Test-Path "scripts/deploy-channel.sh") {
        Write-Host "⚠️  Please run in Git Bash or WSL:" -ForegroundColor Yellow
        Write-Host "   cd fabric-network" -ForegroundColor White
        Write-Host "   bash scripts/deploy-channel.sh" -ForegroundColor White
    } else {
        Write-Host "⚠️  Channel setup script not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Channel already exists" -ForegroundColor Green
}

# Check if chaincode is deployed
$chaincodeExists = docker exec cli peer lifecycle chaincode querycommitted --channelID productledger-channel 2>$null | Select-String "productledger"
if (-not $chaincodeExists) {
    Write-Host "⏳ Deploying chaincode..." -ForegroundColor Yellow
    if (Test-Path "scripts/deploy-chaincode.sh") {
        Write-Host "⚠️  Please run in Git Bash or WSL:" -ForegroundColor Yellow
        Write-Host "   cd fabric-network" -ForegroundColor White
        Write-Host "   bash scripts/deploy-chaincode.sh" -ForegroundColor White
    } else {
        Write-Host "⚠️  Chaincode deployment script not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Chaincode already deployed" -ForegroundColor Green
}

cd ..
Write-Host "✅ Fabric network setup complete" -ForegroundColor Green
Write-Host ""

# Step 3: Start PostgreSQL Database
Write-Host "[3/7] Starting PostgreSQL Database..." -ForegroundColor Yellow
docker rm -f product-ledger-db 2>$null
docker-compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 8
Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
Write-Host ""

# Step 4: Build Backend
Write-Host "[4/7] Building Backend..." -ForegroundColor Yellow
cd server
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend" -ForegroundColor Red
    cd ..
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green
cd ..
Write-Host ""

# Step 5: Start Backend Server
Write-Host "[5/7] Starting Backend Server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "server" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5
$backendRunning = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds 2
}
if ($backendRunning) {
    Write-Host "✅ Backend server is running on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend may still be starting. Check logs: server/logs/combined.log" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Start Frontend
Write-Host "[6/7] Starting Frontend..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "." -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5
$frontendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendRunning = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds 2
}
if ($frontendRunning) {
    Write-Host "✅ Frontend is running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend may still be starting..." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔧 Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "🗄️  Database:  localhost:5432" -ForegroundColor Cyan
Write-Host "⛓️  Fabric:    Running (2 orgs, 1 channel)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host "  cd fabric-network && docker-compose down" -ForegroundColor White
Write-Host "  Stop-Process -Id $($backendProcess.Id) -ErrorAction SilentlyContinue" -ForegroundColor White
Write-Host "  Stop-Process -Id $($frontendProcess.Id) -ErrorAction SilentlyContinue" -ForegroundColor White
Write-Host ""
Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
Write-Host ""

