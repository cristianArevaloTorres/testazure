using Azure.Messaging.ServiceBus;
using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Infrastructure.Persistence;
using LocktonOrion.Infrastructure.Scraping;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace LocktonOrion.Functions;

public class ScrapingTriggerFunction
{
    private readonly AppDbContext _context;
    private readonly IPlaywrightScrapingService _scrapingService;
    private readonly ILogger<ScrapingTriggerFunction> _logger;

    public ScrapingTriggerFunction(
        AppDbContext context,
        IPlaywrightScrapingService scrapingService,
        ILogger<ScrapingTriggerFunction> logger)
    {
        _context = context;
        _scrapingService = scrapingService;
        _logger = logger;
    }

    [Function(nameof(ScrapingTriggerFunction))]
    public async Task Run(
        [ServiceBusTrigger(
            "quotation-requests",
            "scraping-service",
            Connection = "AzureServiceBus:ConnectionString")] ServiceBusReceivedMessage message,
        CancellationToken ct)
    {
        _logger.LogInformation("Processing scraping message {MessageId}", message.MessageId);

        QuotationScrapingMessage? payload = null;

        try
        {
            payload = JsonSerializer.Deserialize<QuotationScrapingMessage>(message.Body.ToString());

            if (payload is null)
            {
                _logger.LogError("Invalid message payload for MessageId {MessageId}. Sending to DLQ via throw.", message.MessageId);
                throw new InvalidOperationException("Cannot deserialize message payload.");
            }

            var quotation = await _context.QuotationRequests
                .FirstOrDefaultAsync(q => q.Id == payload.QuotationId, ct);

            if (quotation is null)
            {
                _logger.LogError("Quotation {QuotationId} not found", payload.QuotationId);
                throw new InvalidOperationException($"Quotation {payload.QuotationId} not found.");
            }

            // Update status to Processing
            quotation.Status = QuotationStatus.Processing;
            quotation.ProcessingStartedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(ct);

            // Get active insurers for this insurance type
            var insurers = await _context.Insurers
                .Where(i => i.IsActive && !i.IsDeleted && i.SupportsAutoScraping)
                .ToListAsync(ct);

            var anySuccess = false;
            var scrapeErrors = new List<string>();

            foreach (var insurer in insurers)
            {
                var job = new ScrapingJob
                {
                    QuotationRequestId = quotation.Id,
                    InsurerId = insurer.Id,
                    Status = ScrapingJobStatus.Processing,
                    AttemptNumber = message.DeliveryCount,
                    ServiceBusMessageId = message.MessageId,
                    StartedAt = DateTimeOffset.UtcNow,
                    CreatedBy = "ScrapingFunction"
                };

                await _context.ScrapingJobs.AddAsync(job, ct);
                await _context.SaveChangesAsync(ct);

                var requestData = JsonSerializer.Deserialize<object>(quotation.RequestDataJson) ?? new { };

                var result = await _scrapingService.ScrapeInsurerAsync(
                    quotation.Id,
                    insurer.Id,
                    insurer.PortalUrl ?? string.Empty,
                    insurer.ScrapingConfigJson ?? "{}",
                    requestData,
                    ct);

                job.CompletedAt = DateTimeOffset.UtcNow;
                job.DurationMs = (long)(job.CompletedAt.Value - job.StartedAt!.Value).TotalMilliseconds;

                if (result.Success && result.AnnualPremium.HasValue)
                {
                    job.Status = ScrapingJobStatus.Completed;
                    anySuccess = true;

                    var quotationResult = new QuotationResult
                    {
                        QuotationRequestId = quotation.Id,
                        InsurerId = insurer.Id,
                        ProductName = result.ProductName ?? "Seguro",
                        AnnualPremium = result.AnnualPremium.Value,
                        MonthlyPremium = result.MonthlyPremium ?? result.AnnualPremium.Value / 12,
                        Deductible = result.Deductible ?? 0,
                        CoverageDetailsJson = result.CoverageJson ?? "{}",
                        ValidUntil = result.ValidUntil,
                        PolicyNumber = result.PolicyNumber,
                        ScrapedAt = DateTimeOffset.UtcNow,
                        CreatedBy = "ScrapingFunction"
                    };

                    await _context.QuotationResults.AddAsync(quotationResult, ct);
                }
                else
                {
                    job.Status = ScrapingJobStatus.Failed;
                    job.ErrorMessage = result.ErrorMessage;
                    scrapeErrors.Add($"{insurer.Name}: {result.ErrorMessage}");
                }

                _context.ScrapingJobs.Update(job);
                await _context.SaveChangesAsync(ct);
            }

            // Update quotation final status
            quotation.Status = anySuccess ? QuotationStatus.Completed : QuotationStatus.Failed;
            quotation.ProcessingCompletedAt = DateTimeOffset.UtcNow;

            if (!anySuccess)
                quotation.LastErrorMessage = string.Join("; ", scrapeErrors);

            await _context.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Scraping completed for quotation {QuotationId}. Success: {AnySuccess}, Insurers: {Count}",
                payload.QuotationId, anySuccess, insurers.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error processing scraping message {MessageId}", message.MessageId);

            if (message.DeliveryCount >= 5 && payload is not null)
            {
                _logger.LogError("Max retries exceeded for message {MessageId}.", message.MessageId);
                var quotation = await _context.QuotationRequests
                    .FirstOrDefaultAsync(q => q.Id == payload.QuotationId, ct);
                if (quotation is not null)
                {
                    quotation.Status = QuotationStatus.Failed;
                    quotation.LastErrorMessage = $"Max retries exceeded: {ex.Message}";
                    await _context.SaveChangesAsync(ct);
                }
            }
            // Always re-throw so Service Bus handles retry / DLQ
            throw;
        }
    }
}

public record QuotationScrapingMessage(
    Guid QuotationId,
    Guid ClientId,
    string InsuranceType,
    DateTimeOffset RequestedAt);
