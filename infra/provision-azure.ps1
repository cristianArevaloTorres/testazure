# ============================================================
#  Lockton Orion – Crear infraestructura Azure (prod)
#  Ejecutar UNA SOLA VEZ para provisionar todos los recursos
# ============================================================

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

$RG           = "lockton-orion-prod-rg"
$LOCATION     = "eastus"
$SQL_SERVER   = "lockton-orion-prod-sql"
$SQL_DB       = "LocktonOrionDb"
$SQL_USER     = "locktonadmin"
$SQL_PASS     = "LocktonProd_Secure2026!@"
$SB_NAMESPACE = "lockton-orion-prod-sb"
$STORAGE      = "locktonorionprodstor"
$ASP_NAME     = "lockton-orion-prod-asp"
$API_APP      = "lockton-orion-prod-api"
$FUNC_APP     = "lockton-orion-prod-func"
$FUNC_STOR    = "locktonorionfstor"

# Generar secrets seguros
$JWT_SECRET = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
$AES_KEY    = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  LOCKTON ORION – Infraestructura Prod" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ─── 1. Resource Group ──────────────────────────────────────
Write-Host "`n[1/8] Resource Group..." -ForegroundColor Yellow
az group create --name $RG --location $LOCATION --output none
Write-Host "  OK" -ForegroundColor Green

# ─── 2. SQL Server + Database ───────────────────────────────
Write-Host "`n[2/8] SQL Server + Database..." -ForegroundColor Yellow
az sql server create `
    --name $SQL_SERVER --resource-group $RG --location $LOCATION `
    --admin-user $SQL_USER --admin-password $SQL_PASS --output none

az sql server firewall-rule create `
    --resource-group $RG --server $SQL_SERVER `
    --name AllowAzureServices `
    --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 --output none

az sql db create `
    --resource-group $RG --server $SQL_SERVER --name $SQL_DB `
    --service-objective Basic --output none

$SQL_CONN = "Server=tcp:${SQL_SERVER}.database.windows.net,1433;Initial Catalog=${SQL_DB};Persist Security Info=False;User ID=${SQL_USER};Password=${SQL_PASS};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
Write-Host "  OK" -ForegroundColor Green

# ─── 3. Service Bus ─────────────────────────────────────────
Write-Host "`n[3/8] Azure Service Bus..." -ForegroundColor Yellow
az servicebus namespace create `
    --name $SB_NAMESPACE --resource-group $RG --location $LOCATION `
    --sku Standard --output none

az servicebus topic create `
    --namespace-name $SB_NAMESPACE --resource-group $RG `
    --name quotation-requests --output none

az servicebus topic subscription create `
    --namespace-name $SB_NAMESPACE --resource-group $RG `
    --topic-name quotation-requests --name scraping-service --output none

az servicebus topic create `
    --namespace-name $SB_NAMESPACE --resource-group $RG `
    --name quotation-results --output none

az servicebus queue create `
    --namespace-name $SB_NAMESPACE --resource-group $RG `
    --name notifications --output none

$SB_CONN = $(az servicebus namespace authorization-rule keys list `
    --resource-group $RG --namespace-name $SB_NAMESPACE `
    --name RootManageSharedAccessKey --query primaryConnectionString -o tsv)
Write-Host "  OK" -ForegroundColor Green

# ─── 4. Storage Account (para Functions) ────────────────────
Write-Host "`n[4/8] Storage Account..." -ForegroundColor Yellow
az storage account create `
    --name $FUNC_STOR --resource-group $RG --location $LOCATION `
    --sku Standard_LRS --kind StorageV2 --output none
$STORAGE_CONN = $(az storage account show-connection-string `
    --name $FUNC_STOR --resource-group $RG --query connectionString -o tsv)
Write-Host "  OK" -ForegroundColor Green

# ─── 5. App Service Plan + Web App (API) ────────────────────
Write-Host "`n[5/8] App Service Plan + API Web App..." -ForegroundColor Yellow
az appservice plan create `
    --name $ASP_NAME --resource-group $RG --location $LOCATION `
    --sku B1 --is-linux false --output none

az webapp create `
    --name $API_APP --resource-group $RG --plan $ASP_NAME `
    --runtime "dotnet:8" --output none
Write-Host "  OK" -ForegroundColor Green

# ─── 6. Function App ────────────────────────────────────────
Write-Host "`n[6/8] Function App..." -ForegroundColor Yellow
az functionapp create `
    --name $FUNC_APP --resource-group $RG `
    --storage-account $FUNC_STOR `
    --consumption-plan-location $LOCATION `
    --runtime dotnet-isolated --runtime-version 8 `
    --functions-version 4 --os-type Windows --output none
Write-Host "  OK" -ForegroundColor Green

# ─── 7. App Settings – API ──────────────────────────────────
Write-Host "`n[7/8] Configurando App Settings API..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $API_APP --resource-group $RG --output none `
    --settings `
        "ASPNETCORE_ENVIRONMENT=Production" `
        "ConnectionStrings__DefaultConnection=$SQL_CONN" `
        "JwtSettings__Secret=$JWT_SECRET" `
        "JwtSettings__Issuer=lockton-orion-api" `
        "JwtSettings__Audience=lockton-orion-client" `
        "JwtSettings__ExpiryMinutes=15" `
        "Encryption__AesKey=$AES_KEY" `
        "AzureServiceBus__ConnectionString=$SB_CONN" `
        "AzureServiceBus__QuotationRequestsTopic=quotation-requests" `
        "AzureServiceBus__QuotationResultsTopic=quotation-results" `
        "AzureServiceBus__NotificationsQueue=notifications" `
        "Anthropic__ApiKey=" `
        "Cors__AllowedOrigins__0=https://${API_APP}.azurewebsites.net"
Write-Host "  OK" -ForegroundColor Green

# ─── 8. App Settings – Functions ────────────────────────────
Write-Host "`n[8/8] Configurando App Settings Functions..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FUNC_APP --resource-group $RG --output none `
    --settings `
        "ASPNETCORE_ENVIRONMENT=Production" `
        "ConnectionStrings__DefaultConnection=$SQL_CONN" `
        "AzureServiceBus__ConnectionString=$SB_CONN" `
        "AzureWebJobsStorage=$STORAGE_CONN"
Write-Host "  OK" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Infraestructura creada exitosamente!" -ForegroundColor Green
Write-Host "  API URL: https://$API_APP.azurewebsites.net" -ForegroundColor Cyan
Write-Host "  JWT Secret guardado en App Settings" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Exportar valores para el deploy
$global:SQL_CONN    = $SQL_CONN
$global:SB_CONN     = $SB_CONN
$global:JWT_SECRET  = $JWT_SECRET
$global:AES_KEY     = $AES_KEY
$global:API_APP     = $API_APP
$global:FUNC_APP    = $FUNC_APP
$global:RG          = $RG
