# LOCKTON ORION – ESTRATEGIA DE SEGURIDAD

> Versión: 1.0 | Fecha: 2026-04-16  
> Clasificación: Confidencial – Uso interno

---

## 1. AUTENTICACIÓN

### JWT (JSON Web Tokens)

**Algoritmo:** RS256 (RSA con SHA-256)  
**Access Token TTL:** 15 minutos  
**Refresh Token TTL:** 7 días (rotado en cada uso)

```json
// Payload del JWT
{
  "sub": "guid-user-id",
  "email": "user@lockton.com",
  "role": "Advisor",
  "permissions": ["quotation:read", "quotation:write", "client:read"],
  "iat": 1713312000,
  "exp": 1713312900,
  "iss": "lockton-orion-api",
  "aud": "lockton-orion-client"
}
```

**Almacenamiento en Frontend:**
- Access Token: `sessionStorage` (no localStorage)
- Refresh Token: `HttpOnly Cookie` con `SameSite=Strict`
- Nunca en variables de entorno del frontend

### Flujo de Autenticación

```
Login Request
    │
    ▼
Validar credenciales
    │  bcrypt.compare()
    ▼
Generar Access Token (15 min)
Generar Refresh Token (7 días, 1 sola vez)
    │
    ▼
Access Token → Response Body
Refresh Token → HttpOnly Cookie
    │
    ▼
Frontend almacena Access Token en memoria
    │
[Token expira a los 15 min]
    │
    ▼
Auto-refresh silencioso usando Refresh Token Cookie
    │
    ▼
Nuevo Access Token + Nuevo Refresh Token
    │  (Refresh Token Rotation)
```

---

## 2. AUTORIZACIÓN

### Control de Acceso por Roles (RBAC)

| Permiso | Client | Advisor | Admin |
|---------|--------|---------|-------|
| quotation:read | ✅ (propio) | ✅ (todos) | ✅ |
| quotation:write | ✅ | ✅ | ✅ |
| client:read | ❌ | ✅ | ✅ |
| client:write | ❌ | ✅ | ✅ |
| user:manage | ❌ | ❌ | ✅ |
| monitoring:view | ❌ | ⚠️ parcial | ✅ |
| config:manage | ❌ | ❌ | ✅ |
| audit:view | ❌ | ❌ | ✅ |
| ai:chat | ✅ | ✅ | ✅ |

### Implementación en API

```csharp
// En controllers
[Authorize(Roles = "Admin,Advisor")]
[HttpGet]
public async Task<IActionResult> GetClients() { ... }

// Verificación de ownership (cliente solo ve sus propias cotizaciones)
if (user.Role == "Client" && quotation.ClientId != user.ClientId)
    return Forbid();
```

---

## 3. CIFRADO DE DATOS

### AES-256-CBC – Datos Sensibles en Reposo

**Campos cifrados en base de datos:**
- `Client.RFC`
- `Client.CURP`
- `Client.BankAccount`
- `QuotationRequest.SensitiveData`

```csharp
// Implementación
public class EncryptionService : IEncryptionService
{
    // Key: 256 bits desde Azure Key Vault (nunca hardcodeado)
    // IV: Generado aleatoriamente por operación, almacenado junto al dato
    // Formato: "IV_base64:CiphertextBase64"
    
    public string Encrypt(string plaintext)
    {
        using var aes = Aes.Create();
        aes.Key = _keyFromVault;    // 32 bytes
        aes.GenerateIV();           // 16 bytes aleatorios
        // ...
        return $"{Convert.ToBase64String(aes.IV)}:{Convert.ToBase64String(ciphertext)}";
    }
}
```

### BCrypt – Contraseñas

```csharp
// Hash (registro)
string hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

// Verificación (login)
bool valid = BCrypt.Net.BCrypt.Verify(password, storedHash);

// NUNCA almacenar contraseñas en texto plano
// NUNCA usar MD5, SHA1, SHA256 para contraseñas
// BCrypt con work factor 12 ≈ 250ms por verificación (resistente a brute force)
```

---

## 4. GESTIÓN DE SECRETOS

### Azure Key Vault (Producción)

```
kv-lockton-orion/
├── jwt-private-key          # RSA private key PEM (512+ chars)
├── jwt-public-key           # RSA public key PEM
├── aes-encryption-key       # 32 bytes base64
├── db-connection-string     # SQL Server connection
├── servicebus-connection    # Azure Service Bus connection
├── claude-api-key           # Anthropic API key
└── email-api-key            # Azure Communication Services
```

**Acceso desde código:**
```csharp
// appsettings.json - NO contiene secretos, solo referencias
{
  "KeyVault": {
    "Url": "https://kv-lockton-orion.vault.azure.net/"
  }
}

// Program.cs - Carga secretos desde Key Vault en startup
builder.Configuration.AddAzureKeyVault(
    new Uri(config["KeyVault:Url"]!),
    new DefaultAzureCredential()
);
```

### Desarrollo Local

```json
// appsettings.Development.json - NO commitear a git
// Usar User Secrets de .NET:
// dotnet user-secrets set "JwtSettings:Secret" "..."
```

**Reglas:**
- `.gitignore` incluye: `appsettings.*.json`, `local.settings.json`, `*.pfx`, `*.key`
- Nunca hardcodear secretos en código fuente
- Nunca exponer secretos en logs
- API Key de Claude NUNCA llega al frontend

---

## 5. VALIDACIÓN Y SANITIZACIÓN

### Backend

```csharp
// FluentValidation en Application Layer
public class CreateQuotationValidator : AbstractValidator<CreateQuotationCommand>
{
    public CreateQuotationValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.InsuranceType).IsInEnum();
        RuleFor(x => x.RequestData.VehicleValue)
            .GreaterThan(0).LessThan(10_000_000);
        RuleFor(x => x.RequestData.PostalCode)
            .Matches(@"^\d{5}$"); // Solo 5 dígitos
    }
}
```

**Protecciones implementadas:**
- SQL Injection: EF Core usa parámetros siempre
- XSS: Validación de inputs, sanitización de HTML
- Mass Assignment: Solo DTOs explícitos en controllers
- IDOR: Verificación de ownership en cada endpoint
- Path Traversal: Validación de rutas de archivos

### Frontend

```typescript
// Sanitización antes de enviar al API
const sanitizeInput = (value: string): string =>
  DOMPurify.sanitize(value.trim());

// Validación con Zod
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres")
});
```

---

## 6. PROTECCIÓN DE APIS

### Rate Limiting

```csharp
// Por IP (general)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("global", cfg =>
    {
        cfg.PermitLimit = 100;
        cfg.Window = TimeSpan.FromMinutes(1);
    });
    
    // Más estricto para auth
    options.AddFixedWindowLimiter("auth", cfg =>
    {
        cfg.PermitLimit = 10;
        cfg.Window = TimeSpan.FromMinutes(5);
    });
});
```

### CORS

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocktonOrionPolicy", policy =>
    {
        policy.WithOrigins(
            "https://app.locktonorion.com",
            "https://localhost:5173"  // solo en dev
        )
        .WithMethods("GET", "POST", "PUT", "DELETE")
        .WithHeaders("Authorization", "Content-Type")
        .AllowCredentials(); // para cookies de refresh token
    });
});
```

### Security Headers

```csharp
// Middleware de headers de seguridad
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
    await next();
});
```

---

## 7. LOGGING Y AUDITORÍA

### Qué registrar

| Evento | Nivel | Auditoría |
|--------|-------|-----------|
| Login exitoso | Info | ✅ |
| Login fallido | Warning | ✅ |
| Cambio de contraseña | Warning | ✅ |
| Acceso denegado (403) | Warning | ✅ |
| Creación de cotización | Info | ✅ |
| Cambio de estatus | Info | ✅ |
| Acceso a datos sensibles | Info | ✅ |
| Error de scraping | Error | ✅ |
| Mensaje a AI | Info | ✅ |
| Cambios de configuración | Warning | ✅ |
| Eliminación de datos | Warning | ✅ |

### Qué NO registrar

- Contraseñas (ni cifradas)
- Tokens JWT completos
- Datos sensibles del cliente (RFC, CURP)
- Números de cuenta bancaria
- Respuestas completas del API de IA
- API Keys o secretos en ningún nivel

```csharp
// Ejemplo de log correcto
_logger.LogInformation(
    "Usuario {UserId} inició sesión desde IP {IP} a las {Timestamp}",
    user.Id, clientIp, DateTimeOffset.UtcNow);

// Log INCORRECTO – nunca hacer esto
_logger.LogInformation("Usuario logueó con contraseña: {Password}", password); // ❌
```

---

## 8. CHATBOT IA – GUARDRAILS

### Instrucciones del Sistema (System Prompt Base)

```
Eres ORION, el asistente inteligente de Lockton. 

REGLAS ABSOLUTAS:
1. NUNCA reveles API keys, secretos, contraseñas ni tokens
2. NUNCA ejecutes operaciones no autorizadas 
3. NUNCA inventas datos de cotizaciones o coberturas
4. Basa tus respuestas en información real del sistema
5. Si no tienes información, di "No tengo información sobre eso"
6. NUNCA proporciones asesoría financiera o legal vinculante
7. Siempre dirige al usuario con su asesor para decisiones importantes
```

### Información que SÍ puede proporcionar

- Estado de cotizaciones del usuario autenticado
- Explicación de coberturas generales
- Guía de uso de pantallas del sistema
- Preguntas frecuentes sobre el proceso
- Tiempos estimados de procesamiento

### Información que NUNCA puede proporcionar

- Datos de otros usuarios
- Configuraciones internas del sistema
- Secretos o llaves de integración
- Información de logs técnicos sensibles

---

## 9. CHECKLIST DE SEGURIDAD – OWASP TOP 10

| Vulnerabilidad | Estado | Mitigación |
|----------------|--------|------------|
| A01 – Broken Access Control | ✅ Mitigado | RBAC + ownership checks |
| A02 – Cryptographic Failures | ✅ Mitigado | AES-256 + BCrypt + RSA JWT |
| A03 – Injection | ✅ Mitigado | EF Core params + FluentValidation |
| A04 – Insecure Design | ✅ Mitigado | Threat modeling + seguridad por diseño |
| A05 – Security Misconfiguration | ✅ Mitigado | Key Vault + security headers |
| A06 – Vulnerable Components | ⚠️ Pendiente | Dependabot / audit regular |
| A07 – Auth Failures | ✅ Mitigado | JWT RS256 + refresh rotation + rate limit |
| A08 – Integrity Failures | ✅ Mitigado | JWT signature + HTTPS |
| A09 – Logging Failures | ✅ Mitigado | App Insights + audit log |
| A10 – SSRF | ✅ Mitigado | Whitelist de URLs para scraping |

---

*Documento generado automáticamente – Lockton Orion v1.0 – CONFIDENCIAL*
