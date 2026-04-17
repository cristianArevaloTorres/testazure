namespace LocktonOrion.Domain.Enums;

public enum QuotationStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    PartiallyCompleted = 3,
    Failed = 4,
    Cancelled = 5,
    Expired = 6,
    Draft = 7
}
