# Create admin user - PowerShell
# Usage: .\scripts\create-admin.ps1
# Or with explicit credentials:
#   $env:ADMIN_EMAIL="you@email.com"; $env:ADMIN_PASSWORD="YourPassword"; .\scripts\create-admin.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not $env:ADMIN_EMAIL -or -not $env:ADMIN_PASSWORD) {
    Write-Host "Set ADMIN_EMAIL and ADMIN_PASSWORD first."
    Write-Host ""
    Write-Host "PowerShell:"
    Write-Host '  $env:ADMIN_EMAIL="you@email.com"'
    Write-Host '  $env:ADMIN_PASSWORD="YourPassword"'
    Write-Host "  .\scripts\create-admin.ps1"
    Write-Host ""
    Write-Host "Or add ADMIN_EMAIL and ADMIN_PASSWORD to server/.env"
    exit 1
}

npx tsx scripts/create-admin.ts
