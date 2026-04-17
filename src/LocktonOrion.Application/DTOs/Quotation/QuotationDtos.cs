using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Application.DTOs.Quotation;

public record CreateQuotationResponseDto(
    Guid Id,
    string ReferenceNumber,
    string Status
);

public record QuotationListItemDto(
    Guid Id,
    string ReferenceNumber,
    string ClientName,
    string InsuranceType,
    string Status,
    DateTimeOffset CreatedAt,
    int ResultsCount,
    DateTimeOffset? ExpiresAt
);

public record QuotationDetailDto(
    Guid Id,
    string ReferenceNumber,
    string ClientName,
    Guid ClientId,
    string InsuranceType,
    string Status,
    object RequestData,
    string? AdvisorNotes,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ProcessingStartedAt,
    DateTimeOffset? ProcessingCompletedAt,
    DateTimeOffset? ExpiresAt,
    int RetryCount,
    string? LastErrorMessage,
    IEnumerable<QuotationResultDto> Results,
    IEnumerable<StatusHistoryDto> History
);

public record QuotationResultDto(
    Guid Id,
    string InsurerName,
    string? InsurerLogoUrl,
    decimal InsurerRating,
    string? InsurerPortalUrl,
    string? InsurerWebsite,
    string ProductName,
    decimal AnnualPremium,
    decimal MonthlyPremium,
    decimal Deductible,
    object Coverage,
    bool IsRecommended,
    decimal RecommendationScore,
    string? RecommendationReason,
    DateOnly? ValidUntil,
    DateTimeOffset ScrapedAt,
    string? ScreenshotUrl
);

public record StatusHistoryDto(
    string PreviousStatus,
    string NewStatus,
    string? Reason,
    string ChangedBy,
    DateTimeOffset ChangedAt
);

public record ComparisonSummaryDto(
    Guid? BestPriceInsurerId,
    decimal? BestPrice,
    Guid? BestCoverageInsurerId,
    decimal? BestCoverageScore,
    Guid? RecommendedInsurerId,
    string? RecommendationReason,
    IEnumerable<QuotationResultDto> Results
);
