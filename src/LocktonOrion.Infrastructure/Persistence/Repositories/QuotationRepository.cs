using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LocktonOrion.Infrastructure.Persistence.Repositories;

public class QuotationRepository : GenericRepository<QuotationRequest>, IQuotationRepository
{
    public QuotationRepository(AppDbContext context) : base(context) { }

    public async Task<QuotationRequest?> GetWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        await _context.QuotationRequests
            .Include(q => q.Client)
            .Include(q => q.RequestedByUser)
            .Include(q => q.Product).ThenInclude(p => p!.Insurer)
            .Include(q => q.Results).ThenInclude(r => r.Insurer)
            .Include(q => q.StatusHistory)
            .Include(q => q.ScrapingJobs).ThenInclude(j => j.Logs)
            .FirstOrDefaultAsync(q => q.Id == id, ct);

    public async Task<IEnumerable<QuotationRequest>> GetByClientAsync(Guid clientId, CancellationToken ct = default) =>
        await _context.QuotationRequests
            .Where(q => q.ClientId == clientId)
            .Include(q => q.Results)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<QuotationRequest>> GetByStatusAsync(QuotationStatus status, CancellationToken ct = default) =>
        await _context.QuotationRequests
            .Where(q => q.Status == status)
            .Include(q => q.Client)
            .ToListAsync(ct);

    public async Task<IEnumerable<QuotationResult>> GetResultsAsync(Guid quotationId, CancellationToken ct = default) =>
        await _context.QuotationResults
            .Where(r => r.QuotationRequestId == quotationId)
            .Include(r => r.Insurer)
            .OrderByDescending(r => r.RecommendationScore)
            .ToListAsync(ct);

    public async Task<(IEnumerable<QuotationRequest> Items, int Total)> GetPagedAsync(
        int page, int pageSize, string? search, QuotationStatus? status,
        Guid? clientId, Guid? advisorId, CancellationToken ct = default)
    {
        var query = _context.QuotationRequests
            .Include(q => q.Client)
            .Include(q => q.Results)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(q =>
                q.ReferenceNumber.Contains(search) ||
                q.Client.FirstName.Contains(search) ||
                q.Client.LastName.Contains(search) ||
                q.Client.Email.Contains(search));

        if (status.HasValue)
            query = query.Where(q => q.Status == status.Value);

        if (clientId.HasValue)
            query = query.Where(q => q.ClientId == clientId.Value);

        if (advisorId.HasValue)
            query = query.Where(q => q.Client.AdvisorId == advisorId.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(q => q.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }
}
