using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string Action { get; set; } = string.Empty;       // Create, Update, Delete, Login, etc.
    public string EntityName { get; set; } = string.Empty;   // QuotationRequest, Client, etc.
    public string? EntityId { get; set; }

    public string? OldValues { get; set; }  // JSON serializado
    public string? NewValues { get; set; }  // JSON serializado

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Endpoint { get; set; }
    public int? HttpStatusCode { get; set; }

    public string? AdditionalInfo { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
