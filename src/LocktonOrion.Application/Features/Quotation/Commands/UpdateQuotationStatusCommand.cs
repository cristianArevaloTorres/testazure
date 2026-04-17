using LocktonOrion.Application.Common;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Application.Features.Quotation.Commands;

public record UpdateQuotationStatusCommand(
    Guid QuotationId,
    string NewStatus,
    string? Reason,
    Guid RequestingUserId
) : IRequest<Result<bool>>;

public class UpdateQuotationStatusCommandHandler : IRequestHandler<UpdateQuotationStatusCommand, Result<bool>>
{
    private readonly IQuotationRepository _quotationRepo;
    private readonly ILogger<UpdateQuotationStatusCommandHandler> _logger;

    public UpdateQuotationStatusCommandHandler(IQuotationRepository quotationRepo, ILogger<UpdateQuotationStatusCommandHandler> logger)
    {
        _quotationRepo = quotationRepo;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(UpdateQuotationStatusCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<QuotationStatus>(request.NewStatus, ignoreCase: true, out var newStatus))
            return Result<bool>.Failure($"Estado inválido: {request.NewStatus}");

        var quotation = await _quotationRepo.GetWithDetailsAsync(request.QuotationId, ct);
        if (quotation is null)
            return Result<bool>.NotFound("Cotización no encontrada");

        var previousStatus = quotation.Status;
        quotation.Status = newStatus;
        quotation.UpdatedBy = request.RequestingUserId.ToString();

        quotation.StatusHistory.Add(new Domain.Entities.StatusHistory
        {
            QuotationRequestId = quotation.Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Reason = request.Reason,
            ChangedBy = request.RequestingUserId.ToString(),
            ChangedAt = DateTimeOffset.UtcNow
        });

        await _quotationRepo.SaveChangesAsync(ct);

        _logger.LogInformation("Quotation {Id} status changed from {Old} to {New}", request.QuotationId, previousStatus, newStatus);

        return Result<bool>.Success(true);
    }
}
