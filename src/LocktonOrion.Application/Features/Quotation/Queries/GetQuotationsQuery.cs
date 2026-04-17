using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Quotation;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;

namespace LocktonOrion.Application.Features.Quotation.Queries;

public record GetQuotationsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    QuotationStatus? Status = null,
    Guid? ClientId = null,
    Guid? AdvisorId = null,
    Guid? RequestingUserId = null,
    string? UserRole = null
) : IRequest<Result<PagedResult<QuotationListItemDto>>>;

public class GetQuotationsQueryHandler : IRequestHandler<GetQuotationsQuery, Result<PagedResult<QuotationListItemDto>>>
{
    private readonly IQuotationRepository _quotationRepo;

    public GetQuotationsQueryHandler(IQuotationRepository quotationRepo)
    {
        _quotationRepo = quotationRepo;
    }

    public async Task<Result<PagedResult<QuotationListItemDto>>> Handle(GetQuotationsQuery request, CancellationToken ct)
    {
        // Clients can only see their own quotations
        var clientId = request.UserRole == "Client" ? request.ClientId : request.ClientId;

        var (items, total) = await _quotationRepo.GetPagedAsync(
            request.Page, request.PageSize, request.Search,
            request.Status, clientId, request.AdvisorId, ct);

        var dtos = items.Select(q => new QuotationListItemDto(
            q.Id,
            q.ReferenceNumber,
            q.Client.FullName,
            q.InsuranceType.ToString(),
            q.Status.ToString(),
            q.CreatedAt,
            q.Results.Count,
            q.ExpiresAt
        ));

        return Result<PagedResult<QuotationListItemDto>>.Success(new PagedResult<QuotationListItemDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        });
    }
}
