using LocktonOrion.Domain.Common;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Entities;

public class StatusHistory : BaseEntity
{
    public Guid QuotationRequestId { get; set; }
    public QuotationRequest QuotationRequest { get; set; } = null!;

    public QuotationStatus PreviousStatus { get; set; }
    public QuotationStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
}
