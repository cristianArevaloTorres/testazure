using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class QuotationResult : AuditableEntity
{
    public Guid QuotationRequestId { get; set; }
    public QuotationRequest QuotationRequest { get; set; } = null!;

    public Guid InsurerId { get; set; }
    public Insurer Insurer { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;
    public decimal AnnualPremium { get; set; }
    public decimal MonthlyPremium { get; set; }
    public decimal Deductible { get; set; }

    // JSON con cobertura detallada
    public string CoverageDetailsJson { get; set; } = "{}";

    public bool IsRecommended { get; set; } = false;
    public decimal RecommendationScore { get; set; } = 0;
    public string? RecommendationReason { get; set; }

    public DateOnly? ValidUntil { get; set; }
    public string? PolicyNumber { get; set; }
    public string? SourceUrl { get; set; }

    public DateTimeOffset ScrapedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsValid { get; set; } = true;

    // URL de la captura de pantalla tomada por Playwright durante el scraping
    public string? ScreenshotUrl { get; set; }
}
