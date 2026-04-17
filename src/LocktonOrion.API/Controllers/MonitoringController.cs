using LocktonOrion.Domain.Enums;
using LocktonOrion.Infrastructure.Persistence;
using LocktonOrion.Infrastructure.Scraping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/monitoring")]
[Authorize(Roles = "Admin,Supervisor")]
[Produces("application/json")]
public class MonitoringController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<MonitoringController> _logger;
    private readonly ScrapingControlService _scrapingControl;

    public MonitoringController(AppDbContext context, ILogger<MonitoringController> logger, ScrapingControlService scrapingControl)
    {
        _context = context;
        _logger = logger;
        _scrapingControl = scrapingControl;
    }

    [HttpGet("dashboard")]
    [SwaggerOperation(Summary = "Dashboard operativo con métricas del sistema")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var today = DateTimeOffset.UtcNow.Date;
        var todayOffset = new DateTimeOffset(today, TimeSpan.Zero);

        var quotationCounts = await _context.QuotationRequests
            .GroupBy(q => q.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalQuotations = quotationCounts.Sum(x => x.Count);
        var pendingQ    = quotationCounts.FirstOrDefault(x => x.Status == QuotationStatus.Pending)?.Count    ?? 0;
        var processingQ = quotationCounts.FirstOrDefault(x => x.Status == QuotationStatus.Processing)?.Count ?? 0;
        var completedQ  = quotationCounts.FirstOrDefault(x => x.Status == QuotationStatus.Completed)?.Count  ?? 0;
        var failedQ     = quotationCounts.FirstOrDefault(x => x.Status == QuotationStatus.Failed)?.Count     ?? 0;

        var activeJobs  = await _context.ScrapingJobs.CountAsync(j => j.Status == ScrapingJobStatus.Processing || j.Status == ScrapingJobStatus.Queued, ct);
        var failedToday = await _context.ScrapingJobs.CountAsync(j => j.Status == ScrapingJobStatus.Failed && j.CreatedAt >= todayOffset, ct);

        var completedJobs = await _context.ScrapingJobs
            .Where(j => j.Status == ScrapingJobStatus.Completed)
            .Select(j => j.DurationMs)
            .ToListAsync(ct);

        var totalJobs   = await _context.ScrapingJobs.CountAsync(ct);
        var successRate = totalJobs > 0 ? completedJobs.Count * 100.0 / totalJobs : 0;
        var avgMs       = completedJobs.Count > 0 ? (long)completedJobs.Average(d => d ?? 0) : 0;

        var activeUsers  = await _context.Users.CountAsync(u => u.IsActive, ct);
        var monthStart   = new DateTimeOffset(today.Year, today.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var newThisMonth = await _context.Users.CountAsync(u => u.CreatedAt >= monthStart, ct);

        var conversationsToday = await _context.ConversationMessages.CountAsync(m => m.Timestamp >= todayOffset, ct);
        var aiResponseTimes    = await _context.ConversationMessages
            .Where(m => m.ResponseMs.HasValue && m.Timestamp >= todayOffset)
            .Select(m => m.ResponseMs!.Value)
            .ToListAsync(ct);

        return Ok(new
        {
            quotations = new { total = totalQuotations, pending = pendingQ, processing = processingQ, completed = completedQ, failed = failedQ },
            scraping   = new { activeJobs, failedToday, successRatePercent = Math.Round(successRate, 1), avgProcessingMs = avgMs },
            messaging  = new { queuesHealthy = true, deadLetterCount = 0, messagesProcessedToday = 0 },
            users      = new { active = activeUsers, newThisMonth },
            ai         = new { conversationsToday, avgResponseMs = aiResponseTimes.Count > 0 ? (long)aiResponseTimes.Average() : 0 }
        });
    }

    [HttpGet("scraping/jobs")]
    [SwaggerOperation(Summary = "Listar jobs de scraping")]
    public async Task<IActionResult> GetScrapingJobs(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = _context.ScrapingJobs
            .Include(j => j.Insurer)
            .Include(j => j.QuotationRequest)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ScrapingJobStatus>(status, ignoreCase: true, out var parsedStatus))
            query = query.Where(j => j.Status == parsedStatus);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(j =>
                j.QuotationRequest.ReferenceNumber.Contains(search) ||
                j.Insurer.Name.Contains(search));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new
            {
                j.Id,
                referenceNumber = j.QuotationRequest != null ? j.QuotationRequest.ReferenceNumber : "—",
                insurerName     = j.Insurer != null ? j.Insurer.Name : "—",
                status          = j.Status.ToString(),
                j.AttemptNumber,
                j.MaxAttempts,
                j.DurationMs,
                j.StartedAt,
                j.CompletedAt,
                j.ErrorMessage,
                j.CreatedAt
            })
            .ToListAsync(ct);

        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return Ok(new
        {
            items,
            totalCount      = total,
            page,
            pageSize,
            totalPages,
            hasPreviousPage = page > 1,
            hasNextPage     = page < totalPages
        });
    }

    [HttpPost("scraping/jobs/{jobId:guid}/retry")]
    [SwaggerOperation(Summary = "Reintentar job de scraping manualmente")]
    public async Task<IActionResult> RetryScrapingJob(Guid jobId, CancellationToken ct)
    {
        var job = await _context.ScrapingJobs.FindAsync(new object[] { jobId }, ct);
        if (job is null)
            return NotFound(new { error = "Job no encontrado" });

        if (job.AttemptNumber >= job.MaxAttempts)
            return BadRequest(new { error = "Se alcanzó el máximo de intentos" });

        job.Status       = ScrapingJobStatus.Queued;
        job.AttemptNumber += 1;
        job.ErrorMessage = null;
        job.NextRetryAt  = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Scraping job {JobId} manually queued for retry (attempt {Attempt})", jobId, job.AttemptNumber);

        return Ok(new { jobId, message = "Job encolado para reintento", attempt = job.AttemptNumber });
    }

    [HttpGet("messaging/queues")]
    [SwaggerOperation(Summary = "Estado de colas de Azure Service Bus")]
    public IActionResult GetQueuesStatus()
    {
        return Ok(new { queues = Array.Empty<object>(), note = "Azure Service Bus no configurado en este entorno" });
    }

    [HttpGet("messaging/dead-letters")]
    [SwaggerOperation(Summary = "Mensajes en Dead Letter Queue")]
    public async Task<IActionResult> GetDeadLetters(CancellationToken ct)
    {
        var deadLettered = await _context.ScrapingJobs
            .Include(j => j.QuotationRequest)
            .Include(j => j.Insurer)
            .Where(j => j.SentToDeadLetter)
            .OrderByDescending(j => j.UpdatedAt)
            .Select(j => new
            {
                j.Id,
                referenceNumber       = j.QuotationRequest.ReferenceNumber,
                insurerName           = j.Insurer.Name,
                j.ErrorMessage,
                j.AttemptNumber,
                j.ServiceBusMessageId,
                j.UpdatedAt
            })
            .ToListAsync(ct);

        return Ok(new { messages = deadLettered, total = deadLettered.Count });
    }

    [HttpPost("messaging/dead-letters/{messageId}/reprocess")]
    [SwaggerOperation(Summary = "Reprocesar mensaje de Dead Letter Queue")]
    public async Task<IActionResult> ReprocessDeadLetter(string messageId, CancellationToken ct)
    {
        var job = await _context.ScrapingJobs
            .FirstOrDefaultAsync(j => j.ServiceBusMessageId == messageId, ct);

        if (job is null)
            return NotFound(new { error = "Mensaje no encontrado" });

        job.SentToDeadLetter = false;
        job.Status           = ScrapingJobStatus.Queued;
        job.AttemptNumber    = 1;
        job.ErrorMessage     = null;

        await _context.SaveChangesAsync(ct);
        return Ok(new { messageId, message = "Mensaje reencolado para procesamiento" });
    }

    [HttpGet("audit")]
    [SwaggerOperation(Summary = "Bitácora de auditoría")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var uid))
            query = query.Where(a => a.UserId == uid);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action.Contains(action));

        if (from.HasValue) query = query.Where(a => a.Timestamp >= from.Value);
        if (to.HasValue)   query = query.Where(a => a.Timestamp <= to.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id, a.UserId, a.Action, a.EntityName, a.EntityId,
                a.IpAddress, a.Endpoint, a.HttpStatusCode, a.Timestamp, a.AdditionalInfo
            })
            .ToListAsync(ct);

        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("metrics")]
    [SwaggerOperation(Summary = "Métricas operativas y de negocio")]
    public async Task<IActionResult> GetMetrics(
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to = null,
        CancellationToken ct = default)
    {
        var fromDate = from ?? DateTimeOffset.UtcNow.AddDays(-30);
        var toDate   = to   ?? DateTimeOffset.UtcNow;

        var quotationsByDay = await _context.QuotationRequests
            .Where(q => q.CreatedAt >= fromDate && q.CreatedAt <= toDate)
            .GroupBy(q => q.CreatedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(x => x.date)
            .ToListAsync(ct);

        var allInPeriod = await _context.QuotationRequests
            .Where(q => q.CreatedAt >= fromDate && q.CreatedAt <= toDate)
            .Select(q => q.Status)
            .ToListAsync(ct);

        var completedStatuses = allInPeriod.Count(s => s == QuotationStatus.Completed);

        var avgCompletionMs = await _context.QuotationRequests
            .Where(q => q.ProcessingStartedAt.HasValue && q.ProcessingCompletedAt.HasValue
                && q.CreatedAt >= fromDate && q.CreatedAt <= toDate)
            .Select(q => (q.ProcessingCompletedAt!.Value - q.ProcessingStartedAt!.Value).TotalMilliseconds)
            .ToListAsync(ct);

        var topInsurers = await _context.QuotationResults
            .Include(r => r.Insurer)
            .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
            .GroupBy(r => r.Insurer.Name)
            .Select(g => new { insurer = g.Key, results = g.Count(), avgPremium = Math.Round(g.Average(r => r.AnnualPremium), 2) })
            .OrderByDescending(x => x.results)
            .Take(5)
            .ToListAsync(ct);

        return Ok(new
        {
            period = new { from = fromDate, to = toDate },
            quotationsByDay,
            conversion = new
            {
                total     = allInPeriod.Count,
                completed = completedStatuses,
                ratePercent = allInPeriod.Count > 0
                    ? Math.Round((double)completedStatuses / allInPeriod.Count * 100, 1)
                    : 0
            },
            avgCompletionMs = avgCompletionMs.Count > 0 ? avgCompletionMs.Average() : 0,
            topInsurers
        });
    }

    // ─── Controles del simulador de scraping ────────────────────────────────

    [HttpGet("scraping/simulator/status")]
    [SwaggerOperation(Summary = "Estado actual del simulador de scraping")]
    public IActionResult GetSimulatorStatus()
    {
        return Ok(new { paused = _scrapingControl.IsPaused });
    }

    [HttpPost("scraping/simulator/pause")]
    [SwaggerOperation(Summary = "Pausar el simulador de scraping")]
    public IActionResult PauseSimulator()
    {
        _scrapingControl.Pause();
        _logger.LogInformation("Simulador de scraping pausado por {User}", User.Identity?.Name);
        return Ok(new { paused = true, message = "Simulador pausado" });
    }

    [HttpPost("scraping/simulator/resume")]
    [SwaggerOperation(Summary = "Reanudar el simulador de scraping")]
    public IActionResult ResumeSimulator()
    {
        _scrapingControl.Resume();
        _logger.LogInformation("Simulador de scraping reanudado por {User}", User.Identity?.Name);
        return Ok(new { paused = false, message = "Simulador reanudado" });
    }

    [HttpDelete("scraping/data")]
    [SwaggerOperation(Summary = "Eliminar jobs de scraping fallidos o todos los datos de simulación")]
    public async Task<IActionResult> DeleteScrapingData(
        [FromQuery] bool all = false,
        CancellationToken ct = default)
    {
        int deleted;

        if (!all)
        {
            var failedJobs = await _context.ScrapingJobs
                .Where(j => j.Status == ScrapingJobStatus.Failed || j.Status == ScrapingJobStatus.DeadLettered)
                .ToListAsync(ct);

            if (failedJobs.Count == 0)
                return Ok(new { deleted = 0, message = "No hay jobs fallidos para eliminar" });

            _context.ScrapingJobs.RemoveRange(failedJobs);
            await _context.SaveChangesAsync(ct);
            deleted = failedJobs.Count;
            _logger.LogInformation("Eliminados {Count} jobs fallidos de scraping por {User}", deleted, User.Identity?.Name);
            return Ok(new { deleted, message = $"{deleted} job{(deleted != 1 ? "s" : "")} eliminado{(deleted != 1 ? "s" : "")}" });
        }
        else
        {
            // Eliminar todos los resultados y jobs de simulación
            var results = await _context.QuotationResults.ToListAsync(ct);
            var jobs    = await _context.ScrapingJobs.ToListAsync(ct);

            _context.QuotationResults.RemoveRange(results);
            _context.ScrapingJobs.RemoveRange(jobs);
            await _context.SaveChangesAsync(ct);

            deleted = jobs.Count;
            _logger.LogWarning("Eliminados TODOS los datos de simulación: {Jobs} jobs, {Results} resultados — por {User}",
                jobs.Count, results.Count, User.Identity?.Name);
            return Ok(new { deleted, deletedResults = results.Count, message = $"Eliminados {jobs.Count} jobs y {results.Count} cotizaciones" });
        }
    }
}
