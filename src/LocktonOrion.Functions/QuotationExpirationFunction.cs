using LocktonOrion.Domain.Enums;
using LocktonOrion.Infrastructure.Persistence;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Functions;

/// <summary>
/// Timer function that runs daily to expire old quotations and clean up stale jobs.
/// </summary>
public class QuotationExpirationFunction
{
    private readonly AppDbContext _context;
    private readonly ILogger<QuotationExpirationFunction> _logger;

    public QuotationExpirationFunction(AppDbContext context, ILogger<QuotationExpirationFunction> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Runs every day at 2:00 AM UTC
    [Function(nameof(QuotationExpirationFunction))]
    public async Task Run(
        [TimerTrigger("0 0 2 * * *")] TimerInfo timerInfo,
        CancellationToken ct)
    {
        _logger.LogInformation("QuotationExpiration timer triggered at {Now}", DateTimeOffset.UtcNow);

        var now = DateTimeOffset.UtcNow;

        // Expire quotations past their expiry date
        var expiredQuotations = await _context.QuotationRequests
            .Where(q => q.ExpiresAt < now &&
                        q.Status != QuotationStatus.Expired &&
                        q.Status != QuotationStatus.Cancelled)
            .ToListAsync(ct);

        foreach (var quotation in expiredQuotations)
        {
            quotation.Status = QuotationStatus.Expired;
            quotation.UpdatedAt = now;
            quotation.UpdatedBy = "QuotationExpirationFunction";
        }

        if (expiredQuotations.Count > 0)
        {
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Expired {Count} quotations", expiredQuotations.Count);
        }

        // Clean up stale scraping jobs (stuck in Processing for > 1 hour)
        var staleJobs = await _context.ScrapingJobs
            .Where(j => j.Status == ScrapingJobStatus.Processing &&
                        j.StartedAt < now.AddHours(-1))
            .ToListAsync(ct);

        foreach (var job in staleJobs)
        {
            job.Status = ScrapingJobStatus.Failed;
            job.ErrorMessage = "Job marked as failed by expiration timer (stuck in processing)";
            job.CompletedAt = now;
        }

        if (staleJobs.Count > 0)
        {
            await _context.SaveChangesAsync(ct);
            _logger.LogWarning("Marked {Count} stale scraping jobs as failed", staleJobs.Count);
        }

        _logger.LogInformation("QuotationExpiration completed. Expired: {Expired}, StaleJobs: {Stale}",
            expiredQuotations.Count, staleJobs.Count);
    }
}
