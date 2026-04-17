# ============================================================
#  Lockton Orion – Deploy completo a Azure
#  Uso: .\deploy.ps1 -Stage dev|prod
# ============================================================
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev","prod")]
    [string]$Stage
)

$ErrorActionPreference = "Stop"

# Cargar variables de entorno de Azure
$env:AZURE_SUBSCRIPTION_ID = [System.Environment]::GetEnvironmentVariable("AZURE_SUBSCRIPTION_ID","User")
$env:AZURE_TENANT_ID       = [System.Environment]::GetEnvironmentVariable("AZURE_TENANT_ID","User")
$env:AZURE_CLIENT_ID       = [System.Environment]::GetEnvironmentVariable("AZURE_CLIENT_ID","User")
$env:AZURE_CLIENT_SECRET   = [System.Environment]::GetEnvironmentVariable("AZURE_CLIENT_SECRET","User")
$env:SERVERLESS_ACCESS_KEY = [System.Environment]::GetEnvironmentVariable("SERVERLESS_ACCESS_KEY","User")

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  LOCKTON ORION – Deploy a Azure [$Stage]" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# ─── 1. BUILD API ────────────────────────────────────────────
Write-Host "`n[1/4] Compilando API..." -ForegroundColor Yellow
Push-Location "src/LocktonOrion.API"
dotnet publish -c Release -o bin/Release/net8.0/publish --nologo -q
Compress-Archive -Force -Path bin/Release/net8.0/publish/* `
    -DestinationPath bin/Release/net8.0/publish/LocktonOrion.API.zip
Pop-Location
Write-Host "  -> API compilada y empaquetada" -ForegroundColor Green

# ─── 2. BUILD FUNCTIONS ──────────────────────────────────────
Write-Host "`n[2/4] Compilando Azure Functions..." -ForegroundColor Yellow
Push-Location "src/LocktonOrion.Functions"
dotnet publish -c Release -o bin/Release/net8.0/publish --nologo -q
Compress-Archive -Force -Path bin/Release/net8.0/publish/* `
    -DestinationPath bin/Release/net8.0/publish/LocktonOrion.Functions.zip
Pop-Location
Write-Host "  -> Functions compiladas y empaquetadas" -ForegroundColor Green

# ─── 3. DEPLOY FUNCTIONS (Serverless) ───────────────────────
Write-Host "`n[3/4] Desplegando Azure Functions con Serverless Framework..." -ForegroundColor Yellow
Push-Location "src/LocktonOrion.Functions"
serverless deploy --stage $Stage
Pop-Location
Write-Host "  -> Functions desplegadas" -ForegroundColor Green

# ─── 4. DEPLOY FRONTEND (Azure Static Web Apps via gh action) ─
Write-Host "`n[4/4] Build frontend para produccion..." -ForegroundColor Yellow
Push-Location "frontend"
npm install --silent
npm run build
Pop-Location
Write-Host "  -> Frontend compilado en frontend/dist/" -ForegroundColor Green

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "  Deploy [$Stage] completado exitosamente!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
