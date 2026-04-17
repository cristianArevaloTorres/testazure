using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Quotation;
using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Domain.Interfaces.Repositories;
using LocktonOrion.Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace LocktonOrion.Application.Features.Quotation.Commands;

public record CreateQuotationCommand(
    Guid ClientId,
    Guid RequestedByUserId,
    InsuranceType InsuranceType,
    Guid? ProductId,
    object RequestData,
    string? Notes) : IRequest<Result<CreateQuotationResponseDto>>;

public class CreateQuotationCommandHandler : IRequestHandler<CreateQuotationCommand, Result<CreateQuotationResponseDto>>
{
    private readonly IQuotationRepository _quotationRepo;
    private readonly IServiceBusPublisher _serviceBus;
    private readonly ILogger<CreateQuotationCommandHandler> _logger;

    public CreateQuotationCommandHandler(
        IQuotationRepository quotationRepo,
        IServiceBusPublisher serviceBus,
        ILogger<CreateQuotationCommandHandler> logger)
    {
        _quotationRepo = quotationRepo;
        _serviceBus = serviceBus;
        _logger = logger;
    }

    public async Task<Result<CreateQuotationResponseDto>> Handle(CreateQuotationCommand request, CancellationToken ct)
    {
        var refNumber = $"QT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        var quotation = new QuotationRequest
        {
            ReferenceNumber = refNumber,
            ClientId = request.ClientId,
            RequestedByUserId = request.RequestedByUserId,
            InsuranceType = request.InsuranceType,
            ProductId = request.ProductId,
            Status = QuotationStatus.Pending,
            RequestDataJson = JsonSerializer.Serialize(request.RequestData),
            AdvisorNotes = request.Notes,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
            CreatedBy = request.RequestedByUserId.ToString()
        };

        await _quotationRepo.AddAsync(quotation, ct);
        await _quotationRepo.SaveChangesAsync(ct);

        // Publicar a Azure Service Bus
        var message = new
        {
            QuotationId = quotation.Id,
            ClientId = request.ClientId,
            InsuranceType = request.InsuranceType.ToString(),
            RequestedAt = DateTimeOffset.UtcNow
        };

        await _serviceBus.PublishAsync("quotation-requests", message,
            new Dictionary<string, object> { { "Type", "QuotationRequest" } }, ct);

        _logger.LogInformation("Quotation {RefNumber} created and published to Service Bus", refNumber);

        return Result<CreateQuotationResponseDto>.Success(
            new CreateQuotationResponseDto(quotation.Id, refNumber, QuotationStatus.Pending.ToString()), 201);
    }
}
