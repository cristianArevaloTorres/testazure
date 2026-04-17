# Stack Tecnológico — Lockton Orion

Plataforma empresarial de cotización de seguros. Arquitectura Full-Stack desacoplada con backend .NET 8 y frontend React/TypeScript.

---

## Visión General

```
┌─────────────────────────────┐     HTTP / REST     ┌──────────────────────────┐
│   Frontend (React + Vite)   │ ◄──────────────────► │  API (.NET 8 ASP.NET)   │
│   localhost:5173            │                      │  localhost:5000          │
└─────────────────────────────┘                      └────────────┬─────────────┘
                                                                   │
                                              ┌────────────────────┼────────────────────┐
                                              ▼                    ▼                    ▼
                                       SQL Server            Azure Service         Anthropic
                                       LocalDB               Bus (prod)            Claude AI
                                       (dev)
```

---

## Backend — .NET 8

### Arquitectura: Clean Architecture en 4 capas

```
LocktonOrion.API            ← Capa de presentación (controllers, middleware)
LocktonOrion.Application    ← Lógica de negocio (commands, queries, DTOs)
LocktonOrion.Domain         ← Entidades, interfaces, enums (sin dependencias externas)
LocktonOrion.Infrastructure ← Persistencia, seguridad, scraping, mensajería
LocktonOrion.Functions      ← Azure Functions (scraping en producción)
```

### LocktonOrion.API

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **ASP.NET Core** | 8.0 | Framework web — controllers, middleware, routing |
| **Swashbuckle (Swagger)** | 7.3 | Documentación automática de la API (`/swagger`) |
| **JWT Bearer Auth** | 8.0 | Autenticación con tokens JWT en cada request |
| **Serilog** | 8.0 | Logging estructurado con timestamps y niveles |
| **Application Insights** | 2.22 | Telemetría y monitoreo en Azure (prod) |
| **Rate Limiter** (built-in) | — | Límite de 200 req/min globales, 10 en endpoints de auth |

**Seguridad activa en la API:**
- Rate limiting por ventana fija
- CORS restrictivo (solo orígenes configurados)
- `AuditMiddleware` — registra cada request con usuario, IP, duración y status
- `ExceptionMiddleware` — captura errores no controlados sin exponer stack traces

### LocktonOrion.Application

Implementa el patrón **CQRS** (Command/Query Responsibility Segregation):

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **MediatR** | 12.4 | Enruta Commands y Queries a sus Handlers sin acoplamiento |
| **FluentValidation** | 11.11 | Valida los DTOs de entrada antes de ejecutar cualquier handler |
| **AutoMapper** | 14.0 | Mapea entidades de dominio a DTOs de respuesta |

**Cómo funciona CQRS aquí:**
- El controller recibe la request y la convierte en un `Command` o `Query`
- MediatR lo enruta automáticamente al `Handler` correcto
- El handler ejecuta la lógica y devuelve un `Result<T>` (patrón de resultado tipado)
- Nunca hay lógica de negocio en los controllers

### LocktonOrion.Infrastructure

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **Entity Framework Core** | 8.0 | ORM — mapea clases C# a tablas SQL, maneja migraciones |
| **EF SQL Server Provider** | 8.0 | Conector para SQL Server / LocalDB |
| **Azure Service Bus SDK** | 7.18 | Cola de mensajes para disparar jobs de scraping (prod) |
| **Azure Key Vault SDK** | 4.7 | Secretos en producción (connection strings, API keys) |
| **Azure Identity** | 1.13 | Autenticación con Azure usando Managed Identity (sin passwords) |
| **BCrypt.Net** | 4.0 | Hash seguro de contraseñas (bcrypt con salt automático) |
| **Microsoft.IdentityModel / System.IdentityModel** | 8.9 | Generación y validación de tokens JWT |
| **Microsoft.Playwright** | 1.50 | Automatización de browser para scraping real de portales (prod) |
| **Serilog + Application Insights sink** | 4.2 | Logs enviados a Azure Monitor en producción |

**Patrones de repositorio:**
- `IGenericRepository<T>` — CRUD genérico con paginación
- `IQuotationRepository` — consultas específicas de cotizaciones
- `AppDbContext` (EF Core) — unidad de trabajo con soft-delete global y auditoría automática

### LocktonOrion.Functions

Azure Functions v4 aisladas (Isolated Worker):

| Función | Trigger | Qué hace |
|---|---|---|
| `ScrapingTriggerFunction` | Service Bus | Recibe un job de scraping, abre el portal de la aseguradora con Playwright y extrae la cotización |
| `QuotationExpirationFunction` | Timer (cron) | Revisa cotizaciones próximas a vencer y envía notificaciones |

> En **desarrollo local** estas Functions se reemplazan por `ScrapingSimulatorService`, un `BackgroundService` que genera cotizaciones realistas directamente en la BD sin necesitar Azure.

---

## Base de Datos — SQL Server

- **LocalDB** en desarrollo (sin instalar SQL Server completo)
- **Azure SQL** en producción
- Las migraciones se manejan con `dotnet ef migrations` — versionadas en código
- Todas las entidades tienen `IsDeleted`, `CreatedAt`, `UpdatedAt`, `CreatedBy` (soft-delete + auditoría)

**Tablas principales:**
| Tabla | Descripción |
|---|---|
| `Users` | Usuarios del sistema (agentes, admins) |
| `Clients` | Clientes asegurados |
| `Insurers` | Aseguradoras (GNP, AXA, Quálitas...) |
| `InsuranceProducts` | Productos por aseguradora |
| `QuotationRequests` | Solicitudes de cotización |
| `QuotationResults` | Resultados obtenidos por scraping |
| `ScrapingJobs` | Cola de trabajos de scraping con estado |
| `AuditLogs` | Registro de todas las operaciones |
| `Conversations` / `ConversationMessages` | Historial del chat con AI |

---

## Frontend — React

### Framework y build

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **React** | 18.3 | Librería de UI basada en componentes |
| **TypeScript** | 5.7 | Tipado estático — previene errores en tiempo de compilación |
| **Vite** | 6.0 | Bundler ultrarrápido con HMR (Hot Module Reload) |
| **Tailwind CSS** | 3.4 | Utilidades CSS — estilos inline sin escribir CSS manual |

### Estado y datos

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **TanStack Query (React Query)** | 5.62 | Cache y sincronización de datos del servidor, auto-refresco |
| **Zustand** | 5.0 | Estado global ligero (sesión del usuario autenticado) |
| **Axios** | 1.7 | Cliente HTTP con interceptores para inyectar el JWT automáticamente |

### Formularios y validación

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **React Hook Form** | 7.54 | Formularios performantes sin re-renders innecesarios |
| **Zod** | 3.24 | Schemas de validación tipados — compartidos entre form y API |
| **@hookform/resolvers** | 3.9 | Conecta Zod con React Hook Form |

### UI y visualización

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **Lucide React** | 0.468 | Iconos SVG (>1000 íconos) |
| **Recharts** | 2.15 | Gráficas de barras, líneas y áreas para dashboards |
| **Framer Motion** | 12.38 | Animaciones y transiciones de UI |
| **clsx + tailwind-merge** | — | Combina clases de Tailwind condicionalmente sin conflictos |
| **date-fns** | 4.1 | Formateo y manipulación de fechas |
| **DOMPurify** | 3.2 | Sanitiza HTML del chat AI para prevenir XSS |

### Routing

- **React Router v6** — rutas anidadas con layouts, rutas protegidas por autenticación

---

## Seguridad Implementada

| Capa | Mecanismo |
|---|---|
| Autenticación | JWT con expiración corta + validación de issuer/audience |
| Contraseñas | BCrypt con salt (nunca se guarda la contraseña en texto plano) |
| Secretos en prod | Azure Key Vault + Managed Identity (sin credenciales hardcodeadas) |
| Inputs del frontend | Zod valida forma y tipos antes de enviar al backend |
| HTML del AI | DOMPurify sanitiza respuestas antes de renderizar |
| Rate limiting | 200 req/min global, 10 req/5min en login para evitar fuerza bruta |
| CORS | Lista blanca de orígenes, no `*` |
| Auditoría | Cada request loguea usuario, IP, endpoint y duración |
| Errores | El middleware captura excepciones sin exponer stack traces al cliente |

---

## Flujo de una Cotización

```
Usuario llena formulario
        │
        ▼
React Hook Form + Zod validan datos
        │
        ▼
POST /api/v1/quotations  (con JWT)
        │
        ▼
AuditMiddleware registra el request
        │
        ▼
QuotationsController → MediatR → CreateQuotationCommandHandler
        │
        ▼
Se crea QuotationRequest + ScrapingJobs (uno por aseguradora activa)
        │
        ▼
  [Desarrollo]                    [Producción]
ScrapingSimulatorService     Azure Service Bus publica mensaje
genera cotizaciones fake       │
directamente en BD             ▼
                          ScrapingTriggerFunction (Azure Functions)
                          abre portal con Playwright
                          extrae prima real
        │
        ▼
QuotationResult guardado en BD con prima, deducible, coberturas y score de recomendación
        │
        ▼
Frontend muestra comparativa con React Query (auto-refresco cada 3s mientras hay jobs activos)
```

---

## Comandos de Desarrollo

```bash
# Backend
cd src/LocktonOrion.API
dotnet run --launch-profile http          # Inicia API en localhost:5000

# Migraciones de BD
cd src/LocktonOrion.Infrastructure
dotnet ef migrations add NombreMigracion --startup-project ../LocktonOrion.API
dotnet ef database update --startup-project ../LocktonOrion.API

# Frontend
cd frontend
npm install
npm run dev                               # Inicia frontend en localhost:5173
npm run build                             # Build de producción
npm run type-check                        # Verifica tipos TypeScript sin compilar
```
