using LocktonOrion.Application.Common;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;

namespace LocktonOrion.Application.Features.Quotation.Commands;

public record AddAdvisorNoteCommand(
    Guid QuotationId,
    string Note,
    Guid RequestingUserId
) : IRequest<Result<bool>>;

public class AddAdvisorNoteCommandHandler : IRequestHandler<AddAdvisorNoteCommand, Result<bool>>
{
    private readonly IQuotationRepository _quotationRepo;

    public AddAdvisorNoteCommandHandler(IQuotationRepository quotationRepo)
    {
        _quotationRepo = quotationRepo;
    }

    public async Task<Result<bool>> Handle(AddAdvisorNoteCommand request, CancellationToken ct)
    {
        var quotation = await _quotationRepo.GetWithDetailsAsync(request.QuotationId, ct);
        if (quotation is null)
            return Result<bool>.NotFound("Cotización no encontrada");

        quotation.AdvisorNotes = string.IsNullOrWhiteSpace(quotation.AdvisorNotes)
            ? request.Note
            : $"{quotation.AdvisorNotes}\n{request.Note}";

        quotation.UpdatedBy = request.RequestingUserId.ToString();

        await _quotationRepo.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
