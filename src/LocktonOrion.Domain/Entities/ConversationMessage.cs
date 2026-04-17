using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class ConversationMessage : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid ConversationId { get; set; }

    public string Role { get; set; } = "user"; // user | assistant | system
    public string Content { get; set; } = string.Empty;

    public string? Model { get; set; }
    public int? TokensUsed { get; set; }
    public long? ResponseMs { get; set; }

    // Context opcional (cotización, cliente)
    public Guid? RelatedQuotationId { get; set; }
    public Guid? RelatedClientId { get; set; }

    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
