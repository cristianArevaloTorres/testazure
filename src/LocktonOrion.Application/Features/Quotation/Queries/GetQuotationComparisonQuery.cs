using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Quotation;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;
using System.Text.Json;

namespace LocktonOrion.Application.Features.Quotation.Queries;

public record GetQuotationComparisonQuery(Guid Id) : IRequest<Result<ComparisonSummaryDto>>;

public class GetQuotationComparisonQueryHandler : IRequestHandler<GetQuotationComparisonQuery, Result<ComparisonSummaryDto>>
{
    private readonly IQuotationRepository _quotationRepo;

    public GetQuotationComparisonQueryHandler(IQuotationRepository quotationRepo)
    {
        _quotationRepo = quotationRepo;
    }

    public async Task<Result<ComparisonSummaryDto>> Handle(GetQuotationComparisonQuery request, CancellationToken ct)
    {
        var results = (await _quotationRepo.GetResultsAsync(request.Id, ct)).ToList();

        if (results.Count == 0)
            return Result<ComparisonSummaryDto>.Failure("Sin resultados disponibles para comparación", 404);

        var resultDtos = results.Select(r => new QuotationResultDto(
            r.Id,
            r.Insurer.Name,
            r.Insurer.LogoUrl,
            r.Insurer.Rating,
            r.Insurer.PortalUrl,
            r.Insurer.Website,
            r.ProductName,
            r.AnnualPremium,
            r.MonthlyPremium,
            r.Deductible,
            TryDeserialize(r.CoverageDetailsJson),
            r.IsRecommended,
            r.RecommendationScore,
            r.RecommendationReason,
            r.ValidUntil,
            r.ScrapedAt,
            r.ScreenshotUrl
        )).ToList();

        var bestPrice = results.MinBy(r => r.AnnualPremium);
        var bestCoverage = results.MaxBy(r => r.RecommendationScore);
        var recommended = results.FirstOrDefault(r => r.IsRecommended) ?? bestCoverage;

        var summary = new ComparisonSummaryDto(
            BestPriceInsurerId: bestPrice?.InsurerId,
            BestPrice: bestPrice?.AnnualPremium,
            BestCoverageInsurerId: bestCoverage?.InsurerId,
            BestCoverageScore: bestCoverage?.RecommendationScore,
            RecommendedInsurerId: recommended?.InsurerId,
            RecommendationReason: recommended?.RecommendationReason,
            Results: resultDtos
        );

        return Result<ComparisonSummaryDto>.Success(summary);
    }

    private static object TryDeserialize(string json)
    {
        try { return JsonSerializer.Deserialize<object>(json) ?? new { }; }
        catch { return new { }; }
    }
}
