
# Final Database Fix Script
# Run this to fix the authentication issue

Write-Host "`n=== FIXING DATABASE AUTHENTICATION ===" -ForegroundColor Cyan

# Step 1: Stop and remove existing container
Write-Host "`n1. Stopping existing container..." -ForegroundColor Yellow
docker stop product-ledger-db 2>$null
docker rm product-ledger-db 2>$null
Write-Host "   Done" -ForegroundColor Green

# Step 2: Create new container with explicit auth configuration
Write-Host "`n2. Creating new container with proper auth..." -ForegroundColor Yellow
$containerId = docker run -d `
  --name product-ledger-db `
  -e POSTGRES_USER=productledger `
  -e POSTGRES_PASSWORD=productledger123 `
  -e POSTGRES_DB=product_ledger_users `
  -e POSTGRES_HOST_AUTH_METHOD=md5 `
  -p 5432:5432 `
  postgres:15-alpine

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Container created: $containerId" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Failed to create container" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for PostgreSQL to be ready
Write-Host "`n3. Waiting for PostgreSQL to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$maxAttempts = 12
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $result = docker exec product-ledger-db pg_isready -U productledger 2>&1
    if ($result -match "accepting connections") {
        $ready = $true
        Write-Host "   PostgreSQL is ready!" -ForegroundColor Green
    } else {
        $attempt++
        Write-Host "   Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "   WARNING: PostgreSQL may not be fully ready" -ForegroundColor Yellow
}

# Step 4: Test connection
Write-Host "`n4. Testing connection..." -ForegroundColor Yellow
$testResult = docker exec product-ledger-db psql -U productledger -d product_ledger_users -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Connection test: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "   Connection test: FAILED" -ForegroundColor Red
    Write-Host "   Error: $testResult" -ForegroundColor Red
}

# Step 5: Update .env file with 127.0.0.1
Write-Host "`n5. Updating server/.env file..." -ForegroundColor Yellow
$envPath = "server\.env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    $content = $content -replace 'DATABASE_URL=postgresql://productledger:productledger123@localhost:5432/product_ledger_users', 'DATABASE_URL=postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users'
    Set-Content -Path $envPath -Value $content -NoNewline
    Write-Host "   Updated DATABASE_URL to use 127.0.0.1" -ForegroundColor Green
} else {
    Write-Host "   WARNING: server/.env not found" -ForegroundColor Yellow
}

# Step 6: Test Node.js connection
Write-Host "`n6. Testing Node.js connection..." -ForegroundColor Yellow
cd server
$nodeTest = node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: 'postgresql://productledger:productledger123@127.0.0.1:5432/product_ledger_users', connectionTimeoutMillis: 5000 }); p.query('SELECT 1').then(() => { console.log('SUCCESS'); p.end(); process.exit(0); }).catch(e => { console.log('FAILED:', e.message); p.end(); process.exit(1); });" 2>&1
cd ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Node.js connection: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "   Node.js connection: FAILED" -ForegroundColor Red
    Write-Host "   Error: $nodeTest" -ForegroundColor Red
}

Write-Host "`n=== FIX COMPLETE ===" -ForegroundColor Cyan
Write-Host "`nNow restart your backend server:" -ForegroundColor Yellow
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

