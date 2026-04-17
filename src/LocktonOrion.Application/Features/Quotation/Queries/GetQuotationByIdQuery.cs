using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Quotation;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;
using System.Text.Json;

namespace LocktonOrion.Application.Features.Quotation.Queries;

public record GetQuotationByIdQuery(Guid Id) : IRequest<Result<QuotationDetailDto>>;

public class GetQuotationByIdQueryHandler : IRequestHandler<GetQuotationByIdQuery, Result<QuotationDetailDto>>
{
    private readonly IQuotationRepository _quotationRepo;

    public GetQuotationByIdQueryHandler(IQuotationRepository quotationRepo)
    {
        _quotationRepo = quotationRepo;
    }

    public async Task<Result<QuotationDetailDto>> Handle(GetQuotationByIdQuery request, CancellationToken ct)
    {
        var quotation = await _quotationRepo.GetWithDetailsAsync(request.Id, ct);

        if (quotation is null)
            return Result<QuotationDetailDto>.Failure("Cotización no encontrada", 404);

        object requestData;
        try
        {
            requestData = JsonSerializer.Deserialize<object>(quotation.RequestDataJson) ?? new { };
        }
        catch
        {
            requestData = new { };
        }

        var results = quotation.Results
            .Where(r => r.IsValid)
            .OrderByDescending(r => r.RecommendationScore)
            .Select(r => new QuotationResultDto(
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
            ));

        var history = quotation.StatusHistory
            .OrderBy(h => h.ChangedAt)
            .Select(h => new StatusHistoryDto(
                h.PreviousStatus.ToString(),
                h.NewStatus.ToString(),
                h.Reason,
                h.ChangedBy,
                h.ChangedAt
            ));

        var dto = new QuotationDetailDto(
            quotation.Id,
            quotation.ReferenceNumber,
            quotation.Client.FullName,
            quotation.ClientId,
            quotation.InsuranceType.ToString(),
            quotation.Status.ToString(),
            requestData,
            quotation.AdvisorNotes,
            quotation.CreatedAt,
            quotation.ProcessingStartedAt,
            quotation.ProcessingCompletedAt,
            quotation.ExpiresAt,
            quotation.RetryCount,
            quotation.LastErrorMessage,
            results,
            history
        );

        return Result<QuotationDetailDto>.Success(dto);
    }

    private static object TryDeserialize(string json)
    {
        try { return JsonSerializer.Deserialize<object>(json) ?? new { }; }
        catch { return new { }; }
    }
}
