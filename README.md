# LOCKTON ORION
### Enterprise Insurance Quotation Platform

> A comprehensive .NET 8 + React insurance quotation system with AI-powered analysis, automated scraping, and real-time monitoring.

---

## Architecture Overview

```
LocktonOrion/
├── src/
│   ├── LocktonOrion.Domain/          # Entities, enums, interfaces
│   ├── LocktonOrion.Application/     # CQRS handlers, DTOs, validation
│   ├── LocktonOrion.Infrastructure/  # EF Core, Azure SB, Playwright, AI
│   ├── LocktonOrion.API/             # .NET 8 Web API (REST endpoints)
│   └── LocktonOrion.Functions/       # Azure Functions v4 (scraping + timers)
├── frontend/                         # React 18 + TypeScript + Vite
├── ARCHITECTURE.md
├── ENDPOINTS.md
├── SECURITY.md
└── PROGRESS.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | .NET 8, Clean Architecture, CQRS/MediatR |
| Database | SQL Server + EF Core 8 (Code First) |
| Messaging | Azure Service Bus (Topics/Subscriptions/DLQ) |
| Functions | Azure Functions v4 Isolated |
| Scraping | Playwright (headless Chromium) |
| AI | Anthropic Claude (claude-3-5-sonnet-20241022) |
| Security | JWT HS256 + AES-256-CBC + BCrypt (work factor 12) |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query |
| Observability | Serilog + Azure Application Insights |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server) (or SQL Server LocalDB)
- [Azure Service Bus](https://azure.microsoft.com/products/service-bus/) namespace
- [Anthropic API key](https://www.anthropic.com/)
- [Azure Functions Core Tools v4](https://github.com/Azure/azure-functions-core-tools)

## Quick Start

### 1. Backend

```bash
cd src

# Restore packages
dotnet restore LocktonOrion.sln

# Configure secrets (never commit these!)
# Edit src/LocktonOrion.API/appsettings.Development.json with your values:
#   ConnectionStrings.DefaultConnection
#   Jwt.Secret (min 32 chars)
#   Encryption.Key (32 bytes Base64)
#   AzureServiceBus.ConnectionString
#   Anthropic.ApiKey

# Run database migrations
dotnet ef database update --project LocktonOrion.Infrastructure --startup-project LocktonOrion.API

# Start API
dotnet run --project LocktonOrion.API
# Available at: https://localhost:7001
# Swagger UI: https://localhost:7001/swagger
```

### 2. Azure Functions

```bash
cd src/LocktonOrion.Functions

# Configure local.settings.json with your Service Bus connection string
func start
```

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
# Available at: http://localhost:5173
```

## Environment Variables (API)

Configure `appsettings.Development.json` (excluded from git):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=LocktonOrion;Trusted_Connection=true;"
  },
  "Jwt": {
    "Secret": "your-minimum-32-char-secret-here",
    "Issuer": "LocktonOrion.API",
    "Audience": "LocktonOrion.Client",
    "ExpiresInMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Encryption": {
    "Key": "BASE64_32_BYTE_KEY_HERE"
  },
  "AzureServiceBus": {
    "ConnectionString": "Endpoint=sb://...",
    "QuotationRequestsTopic": "quotation-requests",
    "QuotationResultsTopic": "quotation-results",
    "NotificationsQueue": "notifications"
  },
  "Anthropic": {
    "ApiKey": "sk-ant-...",
    "Model": "claude-3-5-sonnet-20241022",
    "MaxTokens": 1024
  }
}
```

## Features

### 3 User Roles
| Role | Permissions |
|---|---|
| **Client** | Create/view own quotations, AI chat |
| **Advisor** | All client quotations, client management, AI chat |
| **Admin** | Full access, user management, monitoring, audit |

### 13 Screens
- Login / Register
- Dashboard (role-conditional metrics)
- Quotations list + detail
- Multi-step new quotation wizard
- Side-by-side insurer comparison
- Clients list + detail
- User management (Admin)
- System monitoring dashboard
- Scraping jobs monitor with retry
- ORION AI chat (Claude-powered)
- Audit log explorer

### Security
- JWT HS256 (15-min access + 7-day refresh in HttpOnly cookie)
- AES-256-CBC field encryption for sensitive data
- BCrypt (work factor 12) for passwords
- OWASP Top 10 mitigations
- Rate limiting (200 req/min global, 10 req/5min auth)
- Security headers middleware

## API Documentation

See [ENDPOINTS.md](ENDPOINTS.md) for full REST API contracts.

## Architecture Decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for modular monolith justification, data flow diagrams, and Azure topology.

## Security

See [SECURITY.md](SECURITY.md) for the full OWASP checklist, threat model, and security implementation details.

---

© 2024 Lockton Companies. Enterprise Insurance Solutions.
