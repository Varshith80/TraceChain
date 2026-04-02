# How to Enroll Fabric Identity for Backend

The backend needs a Fabric identity to interact with the blockchain. Here are the methods to create one.

## Method 1: Copy Existing User Identity (Easiest)

If your Fabric network already has user identities generated, you can copy them:

### Step 1: Create Wallet Directory

```powershell
# Navigate to server directory
cd C:\Users\Maniv\TraceChain\product-ledger\server

# Create wallet directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "wallet"
```

### Step 2: Copy User Certificate and Key

```powershell
# Copy certificate
Copy-Item "..\fabric-network\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\signcerts\*.pem" -Destination "wallet\appUser-cert.pem"

# Copy private key (find the key file first)
$keyFile = Get-ChildItem "..\fabric-network\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\keystore\*.pem" | Select-Object -First 1
Copy-Item $keyFile.FullName -Destination "wallet\appUser-key.pem"
```

### Step 3: Create Wallet JSON File

The wallet expects a specific JSON structure. Create `wallet/appUser.json`:

```json
{
  "credentials": {
    "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  },
  "mspId": "Org1MSP",
  "type": "X.509"
}
```

**To generate this file automatically, use this PowerShell script:**

```powershell
# Read certificate
$cert = Get-Content "wallet\appUser-cert.pem" -Raw

# Read private key
$key = Get-Content "wallet\appUser-key.pem" -Raw

# Create wallet JSON
$walletJson = @{
    credentials = @{
        certificate = $cert.Trim()
        privateKey = $key.Trim()
    }
    mspId = "Org1MSP"
    type = "X.509"
} | ConvertTo-Json -Depth 10

# Save to wallet directory with identity label as filename
$walletJson | Out-File -FilePath "wallet\appUser" -Encoding utf8 -NoNewline
```

## Method 2: Use Fabric CA Client (If CA is Running)

### Step 1: Install Fabric CA Client

Download from: https://github.com/hyperledger/fabric-ca/releases

Or use the one in Fabric Docker container:

```powershell
# Copy CA client from Docker container
docker cp cli:/usr/local/bin/fabric-ca-client ./fabric-ca-client
```

### Step 2: Enroll Admin

```bash
# In Git Bash or WSL
cd fabric-network

# Set environment
export FABRIC_CA_CLIENT_HOME=$PWD/ca-client
export FABRIC_CA_CLIENT_TLS_CERTFILES=./crypto-config/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem

# Enroll admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:7054
```

### Step 3: Register New User

```bash
# Register appUser
fabric-ca-client register --id.name appUser --id.secret appUserPw --id.type user --id.affiliation org1
```

### Step 4: Enroll the User

```bash
# Enroll appUser
fabric-ca-client enroll -u https://appUser:appUserPw@localhost:7054 -M ./wallet/appUser
```

## Method 3: Use Backend Enrollment Script (Recommended)

Create a simple enrollment script that uses the Fabric SDK:

```powershell
# Create enroll-identity.ps1 in server directory
```

**File: `server/scripts/enroll-identity.ps1`**

```powershell
# This script enrolls a Fabric identity for the backend

$fabricNetworkPath = "..\fabric-network"
$walletPath = ".\wallet"
$identityLabel = "appUser"

# Create wallet directory
New-Item -ItemType Directory -Force -Path $walletPath | Out-Null

# Check if user identity exists in Fabric crypto material
$userPath = "$fabricNetworkPath\crypto-config\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp"

if (Test-Path $userPath) {
    Write-Host "✅ Found existing user identity, copying to wallet..." -ForegroundColor Green
    
    # Copy certificate
    $certFile = Get-ChildItem "$userPath\signcerts\*.pem" | Select-Object -First 1
    if ($certFile) {
        Copy-Item $certFile.FullName -Destination "$walletPath\appUser-cert.pem" -Force
        Write-Host "✅ Certificate copied" -ForegroundColor Green
    }
    
    # Copy private key
    $keyFile = Get-ChildItem "$userPath\keystore\*.pem" | Select-Object -First 1
    if ($keyFile) {
        Copy-Item $keyFile.FullName -Destination "$walletPath\appUser-key.pem" -Force
        Write-Host "✅ Private key copied" -ForegroundColor Green
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
    
    Write-Host "✅ Identity enrolled successfully!" -ForegroundColor Green
    Write-Host "   Wallet path: $walletPath" -ForegroundColor Gray
    Write-Host "   Identity label: $identityLabel" -ForegroundColor Gray
} else {
    Write-Host "❌ User identity not found at: $userPath" -ForegroundColor Red
    Write-Host "   Please run Fabric network setup first:" -ForegroundColor Yellow
    Write-Host "   cd fabric-network" -ForegroundColor White
    Write-Host "   bash scripts/network-setup.sh" -ForegroundColor White
    exit 1
}
```

**Run the script:**

```powershell
cd server
.\scripts\enroll-identity.ps1
```

## Verify Identity is Enrolled

After enrolling, verify the wallet contains the identity:

```powershell
# Check if wallet file exists
Test-Path "server\wallet\appUser"

# View wallet contents (first few lines)
Get-Content "server\wallet\appUser" | Select-Object -First 5
```

## Troubleshooting

### Error: Identity not found in wallet

**Solution:**
1. Make sure wallet directory exists: `server\wallet`
2. Make sure wallet file exists: `server\wallet\appUser`
3. Check wallet file format (should be valid JSON)
4. Verify identity label matches `FABRIC_IDENTITY_LABEL` in `.env`

### Error: Certificate or key file not found

**Solution:**
1. Run Fabric network setup first: `cd fabric-network && bash scripts/network-setup.sh`
2. Verify crypto material exists: `fabric-network\crypto-config\peerOrganizations\org1.example.com\users\`
3. Check file paths in the enrollment script

### Error: Invalid certificate format

**Solution:**
1. Make sure certificate includes `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
2. Make sure private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. Check for extra whitespace or line breaks

