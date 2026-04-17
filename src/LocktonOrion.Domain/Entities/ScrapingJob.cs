using LocktonOrion.Domain.Common;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Entities;

public class ScrapingJob : AuditableEntity
{
    public Guid QuotationRequestId { get; set; }
    public QuotationRequest QuotationRequest { get; set; } = null!;

    public Guid InsurerId { get; set; }
    public Insurer Insurer { get; set; } = null!;

    public ScrapingJobStatus Status { get; set; } = ScrapingJobStatus.Queued;

    public string? ServiceBusMessageId { get; set; }
    public int AttemptNumber { get; set; } = 1;
    public int MaxAttempts { get; set; } = 5;

    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public long? DurationMs { get; set; }

    public string? ErrorMessage { get; set; }
    public string? ErrorStackTrace { get; set; }
    public DateTimeOffset? NextRetryAt { get; set; }

    public bool SentToDeadLetter { get; set; } = false;

    public ICollection<ScrapingLog> Logs { get; set; } = [];
}
