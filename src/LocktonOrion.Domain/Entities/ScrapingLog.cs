using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class ScrapingLog : BaseEntity
{
    public Guid ScrapingJobId { get; set; }
    public ScrapingJob ScrapingJob { get; set; } = null!;

    public string Level { get; set; } = "Info"; // Info, Warning, Error
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
