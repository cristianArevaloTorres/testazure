namespace LocktonOrion.Domain.Enums;

public enum ScrapingJobStatus
{
    Queued = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    Retrying = 4,
    DeadLettered = 5,
    Cancelled = 6
}
