# Quick Start - Product Ledger (Mock Mode for Testing)
# This starts the project without requiring Fabric network

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Product Ledger - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start PostgreSQL
Write-Host "[1/4] Starting PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 8
Write-Host "✅ PostgreSQL started" -ForegroundColor Green
Write-Host ""

# Step 2: Enable Mock Mode for Quick Testing
Write-Host "[2/4] Configuring backend for mock mode..." -ForegroundColor Yellow
cd server
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "FABRIC_USE_MOCK=true") {
    $envContent = $envContent -replace "FABRIC_USE_MOCK=false", "FABRIC_USE_MOCK=true"
    Set-Content -Path .env -Value $envContent -NoNewline
    Write-Host "✅ Mock mode enabled" -ForegroundColor Green
} else {
    Write-Host "✅ Mock mode already enabled" -ForegroundColor Green
}
cd ..
Write-Host ""

# Step 3: Build and Start Backend
Write-Host "[3/4] Building and starting backend..." -ForegroundColor Yellow
cd server
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$env:FABRIC_USE_MOCK='true'; node dist/index.js"
cd ..
Start-Sleep -Seconds 5
Write-Host "✅ Backend starting in new window" -ForegroundColor Green
Write-Host ""

# Step 4: Start Frontend
Write-Host "[4/4] Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Start-Sleep -Seconds 5
Write-Host "✅ Frontend starting in new window" -ForegroundColor Green
Write-Host ""

# Wait and check
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendOk = $false
$frontendOk = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $backendOk = $true
        Write-Host "✅ Backend:  http://localhost:3001 - RUNNING" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend:  http://localhost:3001 - Starting..." -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $frontendOk = $true
        Write-Host "✅ Frontend: http://localhost:8080 - RUNNING" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend: http://localhost:8080 - Starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 Ready to Test!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open your browser and go to:" -ForegroundColor Yellow
Write-Host "  http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Running in MOCK MODE (no Fabric network required)" -ForegroundColor Gray
Write-Host "To use real Fabric, run: .\START_WITH_FABRIC.ps1" -ForegroundColor Gray
Write-Host ""

