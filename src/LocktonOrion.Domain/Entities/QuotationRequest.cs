using LocktonOrion.Domain.Common;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Entities;

public class QuotationRequest : AuditableEntity
{
    public string ReferenceNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid RequestedByUserId { get; set; }
    public User RequestedByUser { get; set; } = null!;

    public InsuranceType InsuranceType { get; set; }
    public Guid? ProductId { get; set; }
    public InsuranceProduct? Product { get; set; }

    public QuotationStatus Status { get; set; } = QuotationStatus.Pending;

    // JSON con datos específicos del ramo (vehículo, vida, salud, etc.)
    public string RequestDataJson { get; set; } = "{}";

    public string? AdvisorNotes { get; set; }
    public string? InternalNotes { get; set; }

    public DateTimeOffset? ProcessingStartedAt { get; set; }
    public DateTimeOffset? ProcessingCompletedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public int RetryCount { get; set; } = 0;
    public string? LastErrorMessage { get; set; }

    // Navigation
    public ICollection<QuotationResult> Results { get; set; } = [];
    public ICollection<StatusHistory> StatusHistory { get; set; } = [];
    public ICollection<ScrapingJob> ScrapingJobs { get; set; } = [];
}
