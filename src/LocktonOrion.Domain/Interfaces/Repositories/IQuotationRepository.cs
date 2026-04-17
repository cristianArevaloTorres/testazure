using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Interfaces.Repositories;

public interface IQuotationRepository : IGenericRepository<QuotationRequest>
{
    Task<QuotationRequest?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<QuotationRequest>> GetByClientAsync(Guid clientId, CancellationToken ct = default);
    Task<IEnumerable<QuotationRequest>> GetByStatusAsync(QuotationStatus status, CancellationToken ct = default);
    Task<IEnumerable<QuotationResult>> GetResultsAsync(Guid quotationId, CancellationToken ct = default);
    Task<(IEnumerable<QuotationRequest> Items, int Total)> GetPagedAsync(
        int page, int pageSize, string? search, QuotationStatus? status,
        Guid? clientId, Guid? advisorId, CancellationToken ct = default);
}
