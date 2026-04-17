# LOCKTON ORION – ENDPOINTS REST API

> Base URL: `https://api.locktonorion.com/api/v1`  
> Autenticación: Bearer JWT en header `Authorization`  
> Versión: 1.0

---

## AUTH `/api/v1/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | ❌ |
| POST | `/auth/register` | Registrar usuario | ❌ |
| POST | `/auth/refresh` | Renovar token | ❌ |
| POST | `/auth/logout` | Cerrar sesión | ✅ |
| POST | `/auth/forgot-password` | Solicitar recuperación | ❌ |
| POST | `/auth/reset-password` | Restablecer contraseña | ❌ |
| GET | `/auth/profile` | Perfil del usuario actual | ✅ |

### POST /auth/login
```json
// Request
{
  "email": "string",
  "password": "string"
}
// Response 200
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900,
  "user": {
    "id": "guid",
    "name": "string",
    "email": "string",
    "role": "Client|Advisor|Admin"
  }
}
```

### POST /auth/register
```json
// Request
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "Client"
}
// Response 201
{
  "id": "guid",
  "message": "Usuario registrado exitosamente"
}
```

---

## QUOTATIONS `/api/v1/quotations`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/quotations` | Listar cotizaciones | Client, Advisor, Admin |
| POST | `/quotations` | Crear solicitud | Client, Advisor |
| GET | `/quotations/{id}` | Detalle | Client, Advisor, Admin |
| PUT | `/quotations/{id}/status` | Actualizar estatus | Advisor, Admin |
| POST | `/quotations/{id}/notes` | Agregar nota | Advisor, Admin |
| GET | `/quotations/{id}/comparison` | Ver comparativa | Client, Advisor, Admin |
| GET | `/quotations/{id}/results` | Resultados scraping | Client, Advisor, Admin |
| POST | `/quotations/{id}/retry` | Reintentar procesamiento | Admin |
| GET | `/quotations/{id}/history` | Historial de estados | All |
| DELETE | `/quotations/{id}` | Cancelar cotización | Advisor, Admin |

### POST /quotations
```json
// Request
{
  "clientId": "guid",
  "insuranceType": "Auto|Life|Health|Home|Business",
  "productId": "guid",
  "requestData": {
    "applicantName": "string (encrypted)",
    "birthDate": "date",
    "vehicleYear": 2023,
    "vehicleBrand": "string",
    "vehicleModel": "string",
    "vehicleValue": 350000.00,
    "coverageType": "Amplia|LimitadaPlus|RC",
    "postalCode": "string",
    "additionalData": {}
  },
  "notes": "string"
}
// Response 201
{
  "id": "guid",
  "status": "Pending",
  "estimatedProcessingTime": "5-10 minutos",
  "jobId": "guid"
}
```

### GET /quotations/{id}/comparison
```json
// Response 200
{
  "quotationId": "guid",
  "requestSummary": {},
  "results": [
    {
      "id": "guid",
      "insurer": {
        "id": "guid",
        "name": "string",
        "logoUrl": "string",
        "rating": 4.5
      },
      "product": "string",
      "annualPremium": 12500.00,
      "monthlyPremium": 1041.67,
      "deductible": 5000.00,
      "coverage": {
        "material": "Amplia",
        "medical": 200000.00,
        "legal": 500000.00,
        "roadAssistance": true
      },
      "isRecommended": true,
      "recommendationScore": 8.7,
      "validity": "2026-07-16",
      "scrapedAt": "2026-04-16T10:30:00Z"
    }
  ],
  "comparisonSummary": {
    "bestPrice": { "insurerId": "guid", "premium": 10500.00 },
    "bestCoverage": { "insurerId": "guid", "score": 9.2 },
    "recommended": { "insurerId": "guid", "reason": "string" }
  }
}
```

---

## CLIENTS `/api/v1/clients`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/clients` | Listar clientes | Advisor, Admin |
| POST | `/clients` | Crear cliente | Advisor, Admin |
| GET | `/clients/{id}` | Detalle del cliente | Advisor, Admin |
| PUT | `/clients/{id}` | Actualizar cliente | Advisor, Admin |
| DELETE | `/clients/{id}` | Desactivar cliente | Admin |
| GET | `/clients/{id}/quotations` | Cotizaciones del cliente | Advisor, Admin |
| GET | `/clients/search` | Buscar clientes | Advisor, Admin |

### POST /clients
```json
// Request
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "rfc": "string (AES encrypted)",
  "curp": "string (AES encrypted)",
  "birthDate": "date",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "MX"
  },
  "advisorId": "guid"
}
// Response 201
{
  "id": "guid",
  "fullName": "string",
  "createdAt": "timestamp"
}
```

---

## USERS `/api/v1/users`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/users` | Listar usuarios | Admin |
| POST | `/users` | Crear usuario | Admin |
| GET | `/users/{id}` | Detalle | Admin |
| PUT | `/users/{id}` | Actualizar | Admin |
| PUT | `/users/{id}/status` | Activar/Desactivar | Admin |
| PUT | `/users/{id}/role` | Cambiar rol | Admin |
| DELETE | `/users/{id}` | Eliminar | Admin |

---

## AI CHATBOT `/api/v1/ai`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | `/ai/chat` | Enviar mensaje | All |
| GET | `/ai/conversations` | Listar conversaciones | All |
| GET | `/ai/conversations/{id}` | Ver conversación | All |
| DELETE | `/ai/conversations/{id}` | Limpiar conversación | All |

### POST /ai/chat
```json
// Request
{
  "conversationId": "guid (null para nueva)",
  "message": "string",
  "context": {
    "quotationId": "guid (opcional)",
    "clientId": "guid (opcional)"
  }
}
// Response 200
{
  "conversationId": "guid",
  "response": "string",
  "sources": ["string"],
  "timestamp": "ISO8601",
  "tokensUsed": 350,
  "model": "claude-3-5-sonnet-20241022"
}
```

---

## MONITORING `/api/v1/monitoring`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/monitoring/dashboard` | Métricas generales | Admin |
| GET | `/monitoring/scraping/jobs` | Jobs de scraping | Admin |
| GET | `/monitoring/scraping/jobs/{id}` | Detalle de job | Admin |
| POST | `/monitoring/scraping/jobs/{id}/retry` | Reintentar job | Admin |
| GET | `/monitoring/messaging/queues` | Estado de colas | Admin |
| GET | `/monitoring/messaging/dead-letters` | Mensajes DLQ | Admin |
| POST | `/monitoring/messaging/dead-letters/{id}/reprocess` | Reprocesar DLQ | Admin |
| GET | `/monitoring/audit` | Bitácora | Admin |
| GET | `/monitoring/metrics` | Métricas operativas | Admin |

### GET /monitoring/dashboard
```json
// Response 200
{
  "quotations": {
    "total": 1250,
    "pending": 45,
    "processing": 12,
    "completed": 1150,
    "failed": 43
  },
  "scraping": {
    "activeJobs": 8,
    "failedToday": 3,
    "successRatePercent": 96.8,
    "avgProcessingMs": 12500
  },
  "messaging": {
    "queuesHealthy": true,
    "deadLetterCount": 2,
    "messagesProcessedToday": 892
  },
  "users": {
    "active": 234,
    "newThisMonth": 18
  },
  "ai": {
    "conversationsToday": 67,
    "avgResponseMs": 1850
  }
}
```

---

## INSURERS `/api/v1/insurers`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/insurers` | Listar aseguradoras | All |
| GET | `/insurers/{id}` | Detalle | All |
| POST | `/insurers` | Crear | Admin |
| PUT | `/insurers/{id}` | Actualizar | Admin |
| GET | `/insurers/{id}/products` | Productos | All |
| PUT | `/insurers/{id}/config` | Configuración scraping | Admin |

---

## NOTIFICATIONS `/api/v1/notifications`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/notifications` | Listar notificaciones | All |
| PUT | `/notifications/{id}/read` | Marcar como leída | All |
| PUT | `/notifications/read-all` | Marcar todas leídas | All |

---

## CONFIGURACIÓN `/api/v1/config`

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/config/integrations` | Configuraciones de integración | Admin |
| PUT | `/config/integrations/{id}` | Actualizar configuración | Admin |
| GET | `/config/ai-prompts` | Prompts del chatbot | Admin |
| PUT | `/config/ai-prompts/{id}` | Actualizar prompt | Admin |
| GET | `/config/system` | Parámetros del sistema | Admin |
| PUT | `/config/system` | Actualizar parámetros | Admin |

---

## CÓDIGOS DE RESPUESTA

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Creado exitosamente |
| 204 | Sin contenido |
| 400 | Datos inválidos – ver `errors[]` |
| 401 | No autenticado |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado) |
| 422 | Entidad no procesable |
| 429 | Rate limit excedido |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible |

### Formato de error estándar
```json
{
  "type": "ValidationError|NotFound|Unauthorized|ServerError",
  "title": "string",
  "status": 400,
  "traceId": "guid",
  "errors": {
    "field": ["mensaje de error"]
  }
}
```

---

*Documento generado automáticamente – Lockton Orion v1.0*
