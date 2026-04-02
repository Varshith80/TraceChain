# This script enrolls a Fabric identity for the backend

$fabricNetworkPath = "..\fabric-network"
$walletPath = ".\wallet"
$identityLabel = "appUser"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Enrolling Fabric Identity" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create wallet directory
New-Item -ItemType Directory -Force -Path $walletPath | Out-Null
Write-Host "✅ Wallet directory created: $walletPath" -ForegroundColor Green

# Check if user identity exists in Fabric crypto material
$userPath = "$fabricNetworkPath\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp"

if (Test-Path $userPath) {
    Write-Host "✅ Found existing user identity, copying to wallet..." -ForegroundColor Green
    
    # Copy certificate
    $certFile = Get-ChildItem "$userPath\signcerts\*.pem" | Select-Object -First 1
    if ($certFile) {
        Copy-Item $certFile.FullName -Destination "$walletPath\appUser-cert.pem" -Force
        Write-Host "✅ Certificate copied" -ForegroundColor Green
    } else {
        Write-Host "❌ Certificate file not found" -ForegroundColor Red
        exit 1
    }
    
    # Copy private key
    $keyFile = Get-ChildItem "$userPath\keystore\*.pem" | Select-Object -First 1
    if ($keyFile) {
        Copy-Item $keyFile.FullName -Destination "$walletPath\appUser-key.pem" -Force
        Write-Host "✅ Private key copied" -ForegroundColor Green
    } else {
        Write-Host "❌ Private key file not found" -ForegroundColor Red
        exit 1
    }
    
    # Read files and create wallet JSON
    $cert = Get-Content "$walletPath\appUser-cert.pem" -Raw
    $key = Get-Content "$walletPath\appUser-key.pem" -Raw
    
    $walletJson = @{
        credentials = @{
            certificate = $cert.Trim()
            privateKey = $key.Trim()
        }
        mspId = "Org1MSP"
        type = "X.509"
    } | ConvertTo-Json -Depth 10
    
    # Save wallet file (filename is the identity label)
    $walletJson | Out-File -FilePath "$walletPath\$identityLabel" -Encoding utf8 -NoNewline
    
    Write-Host ""
    Write-Host "✅ Identity enrolled successfully!" -ForegroundColor Green
    Write-Host "   Wallet path: $walletPath" -ForegroundColor Gray
    Write-Host "   Identity label: $identityLabel" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ User identity not found at: $userPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run Fabric network setup first:" -ForegroundColor Yellow
    Write-Host "   cd fabric-network" -ForegroundColor White
    Write-Host "   bash scripts/network-setup.sh" -ForegroundColor White
    Write-Host ""
    exit 1
}

