using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class Notification : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // Info, Success, Warning, Error

    public bool IsRead { get; set; } = false;
    public DateTimeOffset? ReadAt { get; set; }

    public string? ActionUrl { get; set; }
    public string? RelatedEntityType { get; set; }
    public string? RelatedEntityId { get; set; }
}
