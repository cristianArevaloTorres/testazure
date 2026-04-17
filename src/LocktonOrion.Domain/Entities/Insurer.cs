using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class Insurer : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? PortalUrl { get; set; }
    public decimal Rating { get; set; } = 0;
    public bool SupportsAutoScraping { get; set; } = true;
    public string? ScrapingConfigJson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public int SortOrder { get; set; } = 0;

    public ICollection<InsuranceProduct> Products { get; set; } = [];
    public ICollection<QuotationResult> QuotationResults { get; set; } = [];
    public ICollection<ScrapingJob> ScrapingJobs { get; set; } = [];
}
