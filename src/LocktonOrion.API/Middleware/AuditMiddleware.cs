using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Interfaces.Repositories;
using System.Security.Claims;
using System.Text.Json;

namespace LocktonOrion.API.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    private static readonly HashSet<string> AuditedMethods = ["POST", "PUT", "DELETE", "PATCH"];
    private static readonly HashSet<string> SkippedPaths = ["/health", "/swagger", "/favicon"];

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var shouldAudit = AuditedMethods.Contains(context.Request.Method) &&
                          !SkippedPaths.Any(p => context.Request.Path.StartsWithSegments(p));

        await _next(context);

        if (shouldAudit && context.User.Identity?.IsAuthenticated == true)
        {
            try
            {
                using var scope = context.RequestServices.CreateScope();
                var auditRepo = scope.ServiceProvider.GetRequiredService<IGenericRepository<AuditLog>>();

                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? context.User.FindFirst("sub")?.Value;

                var auditLog = new AuditLog
                {
                    UserId = userId is not null ? Guid.Parse(userId) : null,
                    Action = context.Request.Method,
                    EntityName = context.Request.Path.ToString().Split('/').LastOrDefault() ?? "Unknown",
                    Endpoint = $"{context.Request.Method} {context.Request.Path}",
                    HttpStatusCode = context.Response.StatusCode,
                    IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString()[..Math.Min(500, context.Request.Headers.UserAgent.ToString().Length)],
                    Timestamp = DateTimeOffset.UtcNow
                };

                await auditRepo.AddAsync(auditLog);
                await auditRepo.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Audit failures should not break the request
                _logger.LogWarning(ex, "Failed to write audit log");
            }
        }
    }
}
