# ============================================================
#  Lockton Orion – Deploy API + Functions a Azure (prod)
#  Prerequisito: haber ejecutado provision-azure.ps1 primero
# ============================================================

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

$RG       = "lockton-orion-prod-rg"
$API_APP  = "lockton-orion-prod-api"
$FUNC_APP = "lockton-orion-prod-func"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  LOCKTON ORION – Deploy a Azure Prod" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ─── 1. Build + Publish API ─────────────────────────────────
Write-Host "`n[1/4] Build API..." -ForegroundColor Yellow
Push-Location "src/LocktonOrion.API"
dotnet publish -c Release -o "publish/api" --nologo -q
Compress-Archive -Force -Path publish/api/* -DestinationPath publish/api.zip
Pop-Location
Write-Host "  -> API empaquetada en src/LocktonOrion.API/publish/api.zip" -ForegroundColor Green

# ─── 2. Deploy API ──────────────────────────────────────────
Write-Host "`n[2/4] Deploy API a Azure App Service..." -ForegroundColor Yellow
az webapp deploy `
    --resource-group $RG --name $API_APP `
    --src-path "src/LocktonOrion.API/publish/api.zip" `
    --type zip --output none
Write-Host "  -> API desplegada en https://$API_APP.azurewebsites.net" -ForegroundColor Green

# ─── 3. Build + Publish Functions ───────────────────────────
Write-Host "`n[3/4] Build Functions..." -ForegroundColor Yellow
Push-Location "src/LocktonOrion.Functions"
dotnet publish -c Release -o "publish/functions" --nologo -q
Compress-Archive -Force -Path publish/functions/* -DestinationPath publish/functions.zip
Pop-Location
Write-Host "  -> Functions empaquetadas" -ForegroundColor Green

# ─── 4. Deploy Functions ────────────────────────────────────
Write-Host "`n[4/4] Deploy Functions a Azure..." -ForegroundColor Yellow
az functionapp deployment source config-zip `
    --resource-group $RG --name $FUNC_APP `
    --src "src/LocktonOrion.Functions/publish/functions.zip" --output none
Write-Host "  -> Functions desplegadas en https://$FUNC_APP.azurewebsites.net" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Deploy completado!" -ForegroundColor Green
Write-Host "  API:       https://$API_APP.azurewebsites.net" -ForegroundColor White
Write-Host "  Swagger:   https://$API_APP.azurewebsites.net/swagger" -ForegroundColor White
Write-Host "  Functions: https://$FUNC_APP.azurewebsites.net" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
