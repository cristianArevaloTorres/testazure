# LOCKTON ORION – ARQUITECTURA DEL SISTEMA

> Versión: 1.0 | Fecha: 2026-04-16  
> Arquitecto: Sistema generado con especificaciones enterprise

---

## 1. DECISIÓN ARQUITECTÓNICA: MODULAR MONOLITH

### ¿Por qué Modular Monolith y no Microservicios?

| Criterio | Modular Monolith | Microservicios |
|----------|-----------------|----------------|
| Tiempo inicial | ✅ Menor | ❌ Mayor overhead |
| Complejidad operativa | ✅ Menor | ❌ Alta (service mesh, discovery, etc.) |
| Transacciones ACID | ✅ Nativas | ❌ Eventual consistency |
| Equipo pequeño-mediano | ✅ Ideal | ❌ Requiere equipos por servicio |
| Evolución futura | ✅ Extraíble a micro | — |
| Debugging / observabilidad | ✅ Simple | ❌ Distribuido |

**Conclusión:** Se elige Modular Monolith con separación clara de módulos para permitir extracción futura a microservicios sin reescritura.

---

## 2. ESTRUCTURA DE MÓDULOS

```
LocktonOrion/
│
├── src/
│   ├── LocktonOrion.Domain/          # Núcleo del negocio (sin dependencias)
│   ├── LocktonOrion.Application/     # Casos de uso, CQRS, DTOs
│   ├── LocktonOrion.Infrastructure/  # EF Core, Azure, AI, Scraping, Seguridad
│   ├── LocktonOrion.API/             # Web API, Controllers, Middleware
│   └── LocktonOrion.Functions/       # Azure Functions (procesamiento async)
│
├── frontend/                          # React + TypeScript + Vite
│
├── ARCHITECTURE.md
├── ENDPOINTS.md
├── SECURITY.md
├── PROGRESS.md
└── README.md
```

---

## 3. CAPAS DE LA ARQUITECTURA

### 3.1 Domain Layer (Núcleo)
```
LocktonOrion.Domain/
├── Common/
│   ├── BaseEntity.cs           # Id, timestamps base
│   └── AuditableEntity.cs      # Auditoría completa
├── Entities/
│   ├── User.cs
│   ├── Role.cs
│   ├── Permission.cs
│   ├── Client.cs
│   ├── QuotationRequest.cs
│   ├── QuotationResult.cs
│   ├── Insurer.cs
│   ├── InsuranceProduct.cs
│   ├── StatusHistory.cs
│   ├── ScrapingJob.cs
│   ├── ScrapingLog.cs
│   ├── IntegrationConfig.cs
│   ├── ConversationMessage.cs
│   ├── AuditLog.cs
│   └── Notification.cs
├── Enums/
│   ├── QuotationStatus.cs
│   ├── UserRole.cs
│   ├── ScrapingJobStatus.cs
│   └── InsuranceType.cs
└── Interfaces/
    ├── Repositories/
    │   ├── IGenericRepository.cs
    │   └── IQuotationRepository.cs
    └── Services/
        ├── ITokenService.cs
        ├── IEncryptionService.cs
        ├── IPasswordHasher.cs
        ├── IServiceBusPublisher.cs
        ├── IAIService.cs
        └── IScrapingService.cs
```

**Regla:** Zero dependencias externas. Solo tipos primitivos y referencias al propio dominio.

### 3.2 Application Layer (Casos de Uso)
```
LocktonOrion.Application/
├── Common/
│   ├── Result.cs
│   ├── PagedResult.cs
│   └── Behaviors/
│       ├── ValidationBehavior.cs
│       └── LoggingBehavior.cs
├── Features/
│   ├── Identity/
│   │   ├── Commands/
│   │   │   ├── LoginCommand.cs + Handler
│   │   │   ├── RegisterCommand.cs + Handler
│   │   │   └── RefreshTokenCommand.cs + Handler
│   │   └── Queries/
│   │       └── GetUserProfileQuery.cs + Handler
│   ├── Quotation/
│   │   ├── Commands/
│   │   │   ├── CreateQuotationCommand.cs + Handler
│   │   │   ├── UpdateQuotationStatusCommand.cs + Handler
│   │   │   └── AddAdvisorNoteCommand.cs + Handler
│   │   └── Queries/
│   │       ├── GetQuotationsQuery.cs + Handler
│   │       ├── GetQuotationByIdQuery.cs + Handler
│   │       └── GetQuotationComparisonQuery.cs + Handler
│   ├── Clients/
│   │   ├── Commands/CreateClientCommand.cs + Handler
│   │   └── Queries/GetClientsQuery.cs + Handler
│   ├── Users/
│   │   ├── Commands/CreateUserCommand.cs + Handler
│   │   └── Queries/GetUsersQuery.cs + Handler
│   ├── AI/
│   │   ├── Commands/SendMessageCommand.cs + Handler
│   │   └── Queries/GetConversationHistoryQuery.cs + Handler
│   └── Monitoring/
│       └── Queries/
│           ├── GetScrapingJobsQuery.cs + Handler
│           └── GetMessagingMetricsQuery.cs + Handler
└── DTOs/
    ├── Auth/
    ├── Quotation/
    ├── Client/
    ├── User/
    ├── AI/
    └── Monitoring/
```

### 3.3 Infrastructure Layer (Adaptadores)
```
LocktonOrion.Infrastructure/
├── Persistence/
│   ├── AppDbContext.cs
│   ├── Configurations/          # Fluent API por entidad
│   ├── Repositories/
│   │   ├── GenericRepository.cs
│   │   └── QuotationRepository.cs
│   └── Migrations/
├── Security/
│   ├── JwtTokenService.cs       # JWT + Refresh Tokens
│   ├── EncryptionService.cs     # AES-256
│   └── PasswordHasher.cs        # BCrypt
├── Messaging/
│   ├── ServiceBusPublisher.cs   # Publicación a Azure Service Bus
│   └── ServiceBusConsumer.cs    # Consumidor con retry/DLQ
├── AI/
│   └── ClaudeAIService.cs       # Integración Anthropic Claude
├── Scraping/
│   └── PlaywrightScrapingService.cs
├── Notifications/
│   └── EmailNotificationService.cs
└── DependencyInjection.cs
```

### 3.4 API Layer
```
LocktonOrion.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── QuotationsController.cs
│   ├── ClientsController.cs
│   ├── UsersController.cs
│   ├── AIController.cs
│   └── MonitoringController.cs
├── Middleware/
│   ├── ExceptionMiddleware.cs
│   └── AuditMiddleware.cs
├── Program.cs
├── appsettings.json
└── appsettings.Development.json
```

### 3.5 Azure Functions
```
LocktonOrion.Functions/
├── ScrapingTriggerFunction.cs     # Trigger: Service Bus → ejecutar scraping
├── DeadLetterProcessorFunction.cs # Trigger: DLQ → reintentos manuales
├── NotificationFunction.cs        # Trigger: Service Bus → notificaciones
├── QuotationExpirationFunction.cs # Timer: verificar cotizaciones expiradas
├── host.json
└── local.settings.json
```

---

## 4. FLUJO DE DATOS

### Flujo Principal: Solicitud de Cotización

```
Cliente/Asesor
    │
    ▼
[React Frontend]
    │  POST /api/quotations
    ▼
[QuotationsController]
    │  MediatR → CreateQuotationCommand
    ▼
[CreateQuotationHandler]
    │  1. Validar datos
    │  2. Guardar en SQL Server
    │  3. Publicar mensaje en Service Bus
    ▼
[Azure Service Bus Topic: quotation-requests]
    │
    ├─► [Subscription: scraping-service]
    │       │
    │       ▼
    │   [ScrapingTriggerFunction]
    │       │  Playwright
    │       ├─► Aseguradora 1
    │       ├─► Aseguradora 2
    │       └─► Aseguradora N
    │           │
    │           ▼
    │       Normalizar resultados
    │       Guardar en DB
    │       Publicar: quotation-results
    │
    └─► [Subscription: notification-service]
            │
            ▼
        [NotificationFunction]
            Email/Push al usuario
```

### Flujo de Error y Reintento

```
ScrapingTriggerFunction
    │  Error
    ▼
Service Bus (retry automático con backoff)
    │  Intentos: 3, 6, 12 min (exponential)
    │  Max intentos: 5
    ▼
Dead Letter Queue (DLQ)
    │
    ▼
[DeadLetterProcessorFunction]
    │  Registrar error en DB
    │  Alertar admin
    │  Permitir reintento manual
    ▼
Admin Panel → Reintento manual
```

### Flujo del Chatbot IA

```
Usuario
    │  POST /api/ai/chat
    ▼
[AIController]
    │
    ▼
[SendMessageHandler]
    │  1. Recuperar historial de conversación
    │  2. Construir system prompt con:
    │     - Contexto del sistema
    │     - Endpoints disponibles
    │     - Estado del trámite (si aplica)
    │     - Reglas de negocio
    │  3. Llamar Claude API
    │  4. Registrar interacción
    │  5. Devolver respuesta
    ▼
[ClaudeAIService]
    │  HTTPS → Anthropic API
    ▼
Respuesta contextual al usuario
```

---

## 5. MODELO DE DATOS

### Diagrama de entidades principales

```
User (1) ─────────────── (*) QuotationRequest
  │                              │
  │                              │
Client (1) ─────────────── (*) QuotationRequest
                                 │
                                 │
                            (*) QuotationResult
                                 │
                                 │
                            (*) Insurer ──── (*) InsuranceProduct
                                 │
                                 │
                            (*) StatusHistory
                                 │
                            (*) ScrapingJob ── (*) ScrapingLog
```

### Campos de Auditoría (en todas las entidades)
```
- CreatedAt: DateTimeOffset
- UpdatedAt: DateTimeOffset
- CreatedBy: string (userId)
- UpdatedBy: string (userId)
- IsActive: bool
- IsDeleted: bool (soft delete)
```

---

## 6. MENSAJERÍA – AZURE SERVICE BUS

### Topics y Subscriptions

```
Topic: quotation-requests
  ├── Subscription: scraping-service
  │     Filter: Type = 'QuotationRequest'
  └── Subscription: notification-service
        Filter: Type = 'QuotationRequest'

Topic: quotation-results
  ├── Subscription: comparison-engine
  └── Subscription: client-notifications

Queue: dead-letter-processor
  (mensajes fallidos de todos los topics)

Queue: notifications
  (notificaciones directas: email, push)

Queue: report-generation
  (generación de reportes PDF asíncrona)
```

### Política de Retry

```json
{
  "maxDeliveryCount": 5,
  "lockDuration": "PT5M",
  "retryPolicy": {
    "mode": "exponential",
    "delays": ["00:01:00", "00:05:00", "00:15:00", "00:45:00", "02:00:00"]
  }
}
```

---

## 7. INFRAESTRUCTURA AZURE

```
Azure Subscription
├── Resource Group: rg-lockton-orion-prod
│   ├── App Service Plan (P2v3)
│   │   ├── App Service: lockton-orion-api
│   │   └── App Service: lockton-orion-functions
│   ├── Azure SQL Server + Database
│   ├── Azure Service Bus (Standard+)
│   │   ├── Topics: quotation-requests, quotation-results
│   │   └── Queues: notifications, dead-letters
│   ├── Azure Key Vault: kv-lockton-orion
│   │   ├── JWT Secret
│   │   ├── AES Encryption Key
│   │   ├── Claude API Key
│   │   ├── DB Connection String
│   │   └── Service Bus Connection String
│   ├── Azure Static Web Apps (Frontend React)
│   ├── Application Insights
│   └── Azure Monitor + Alerts
```

---

## 8. SEGURIDAD

Ver `SECURITY.md` para detalles completos.

**Resumen:**
- JWT RS256 con expiración corta (15 min) + Refresh Token
- AES-256-CBC para datos sensibles en DB (CURP, RFC, datos bancarios)
- BCrypt (work factor 12) para contraseñas
- Azure Key Vault para todos los secretos
- HTTPS obligatorio (TLS 1.2+)
- CORS restrictivo
- Rate limiting por IP y por usuario
- Validación y sanitización en todas las entradas
- Auditoría de acciones en entidades sensibles

---

## 9. OBSERVABILIDAD

```
Application Insights
├── Distributed Tracing (W3C TraceContext)
├── Custom Metrics
│   ├── quotations.created
│   ├── scraping.jobs.success
│   ├── scraping.jobs.failed
│   ├── ai.conversations.total
│   └── servicebus.messages.processed
├── Alertas automáticas
│   ├── Error rate > 5%
│   ├── DLQ messages > 10
│   ├── Response time p95 > 2s
│   └── Scraping failure rate > 20%
└── Dashboards por módulo
```

---

## 10. EVOLUCIÓN A MICROSERVICIOS

Si el sistema crece, estos módulos son candidatos naturales a extraerse:

| Servicio | Trigger de extracción |
|----------|-----------------------|
| IdentityService | Cuando otros sistemas necesiten auth |
| ScrapingService | Cuando el volumen requiera escalar independiente |
| ComparisonEngine | Cuando se integren modelos ML complejos |
| AIAssistantService | Cuando el chatbot requiera orquestación compleja |
| NotificationService | Cuando se agreguen múltiples canales |

La comunicación sería vía:
- **Comandos sincrónicos:** REST o gRPC
- **Eventos asincrónicos:** Azure Service Bus (ya implementado)
- **Contratos:** DTOs/Events compartidos en paquete NuGet interno

---

*Documento generado automáticamente – Lockton Orion v1.0*
