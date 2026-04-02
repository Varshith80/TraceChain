# Product Ledger - Complete Startup Script
# Run this script to start the entire project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Product Ledger - Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Step 2: Start PostgreSQL Database
Write-Host "[2/6] Starting PostgreSQL Database..." -ForegroundColor Yellow
docker rm -f product-ledger-db 2>$null
docker-compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 8
$dbReady = $false
for ($i = 0; $i -lt 10; $i++) {
    $health = docker inspect product-ledger-db --format='{{.State.Health.Status}}' 2>$null
    if ($health -eq "healthy") {
        $dbReady = $true
        break
    }
    Start-Sleep -Seconds 2
}
if ($dbReady) {
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL may not be fully ready, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Initialize Database Schema
Write-Host "[3/6] Initializing Database Schema..." -ForegroundColor Yellow
cd server
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema will be initialized on first backend start" -ForegroundColor Green
cd ..
Write-Host ""

# Step 4: Start Backend Server
Write-Host "[4/6] Starting Backend Server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "server" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5
$backendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
        break
    }
    Start-Sleep -Seconds 2
}
if ($backendRunning) {
    Write-Host "✅ Backend server is running on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend may still be starting. Check logs: server/logs/combined.log" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Start Frontend
Write-Host "[5/6] Starting Frontend..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "." -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5
$frontendRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $frontendRunning = $true
        break
    }
    Start-Sleep -Seconds 2
}
if ($frontendRunning) {
    Write-Host "✅ Frontend is running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend may still be starting..." -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔧 Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "🗄️  Database:  localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host "  Stop-Process -Id $($backendProcess.Id) -ErrorAction SilentlyContinue" -ForegroundColor White
Write-Host "  Stop-Process -Id $($frontendProcess.Id) -ErrorAction SilentlyContinue" -ForegroundColor White
Write-Host ""
Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
Write-Host ""

