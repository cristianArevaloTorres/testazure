using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class IntegrationConfig : AuditableEntity
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public bool IsSensitive { get; set; } = false;
    public string? Category { get; set; } // Scraping, Messaging, AI, Email
    public Guid? InsurerId { get; set; }
    public Insurer? Insurer { get; set; }
}
