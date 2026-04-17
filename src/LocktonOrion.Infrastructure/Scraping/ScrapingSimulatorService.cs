using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace LocktonOrion.Infrastructure.Scraping;

/// <summary>
/// Simula el proceso de scraping en desarrollo local, sin necesitar Azure Functions ni Service Bus.
/// Toma jobs Queued → Processing → Completed y genera resultados realistas por tipo de seguro.
/// </summary>
public class ScrapingSimulatorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ScrapingSimulatorService> _logger;
    private readonly ScrapingControlService _control;

    // Datos base por tipo de seguro para generar cotizaciones realistas
    private static readonly Dictionary<InsuranceType, SimConfig> SimConfigs = new()
    {
        [InsuranceType.Auto] = new(
            Products: ["Auto Clásico — Amplia", "Auto Plus — Amplia", "Auto Ejecutivo — Premium"],
            BaseAnnual: [11_500m, 9_800m, 15_200m],
            BaseDeductible: [5_000m, 8_000m, 3_000m],
            Coverages: [
                """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":true,"responsabilidadCivil":3000000,"gastosMedicos":200000,"asistenciaVial":true,"autoSustituto":15,"cristales":true}""",
                """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":false,"responsabilidadCivil":2000000,"gastosMedicos":100000,"asistenciaVial":true,"autoSustituto":0,"cristales":false}""",
                """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":true,"responsabilidadCivil":5000000,"gastosMedicos":300000,"asistenciaVial":true,"autoSustituto":30,"cristales":true,"equipoEspecial":true}"""
            ],
            Reasons: [
                "Mejor equilibrio precio-cobertura. Incluye asistencia vial 24/7 y robo total.",
                "Prima anual más económica, deducible mayor. Ideal si el vehículo es de poco riesgo.",
                "Cobertura más completa. Menor deducible y mayor responsabilidad civil."
            ]
        ),
        [InsuranceType.Life] = new(
            Products: ["Vida Futura — Temporal 20", "Vida Protección — Dotal", "Vida Premium — Universal"],
            BaseAnnual: [8_400m, 14_760m, 22_800m],
            BaseDeductible: [0m, 0m, 0m],
            Coverages: [
                """{"sumaAsegurada":2000000,"coberturaAccidentes":true,"dobleIndemnizacion":false,"invalidezTotal":true,"enfermedadesGraves":false,"plazo":20}""",
                """{"sumaAsegurada":2000000,"coberturaAccidentes":true,"dobleIndemnizacion":true,"invalidezTotal":true,"enfermedadesGraves":true,"plazo":20,"componenteAhorro":true}""",
                """{"sumaAsegurada":3000000,"coberturaAccidentes":true,"dobleIndemnizacion":true,"invalidezTotal":true,"enfermedadesGraves":true,"plazo":"flexible","componenteInversion":true}"""
            ],
            Reasons: [
                "Protección pura al menor costo. Ideal para maximizar suma asegurada.",
                "Incluye componente de ahorro y cobertura de enfermedades graves.",
                "Mayor suma asegurada con componente de inversión. Prima más alta."
            ]
        ),
        [InsuranceType.Health] = new(
            Products: ["Salud Total — Nacional", "Salud Premium — Internacional", "Salud Familiar — Plus"],
            BaseAnnual: [28_800m, 52_000m, 38_400m],
            BaseDeductible: [10_000m, 15_000m, 8_000m],
            Coverages: [
                """{"sumaAsegurada":5000000,"coberturaNacional":true,"coberturaInternacional":false,"medicamentos":true,"dental":false,"vision":false,"maternidad":false,"preexistencias":false}""",
                """{"sumaAsegurada":10000000,"coberturaNacional":true,"coberturaInternacional":true,"medicamentos":true,"dental":true,"vision":true,"maternidad":true,"preexistencias":false}""",
                """{"sumaAsegurada":7000000,"coberturaNacional":true,"coberturaInternacional":false,"medicamentos":true,"dental":true,"vision":false,"maternidad":false,"preexistencias":false,"coberturaDependientes":3}"""
            ],
            Reasons: [
                "Cobertura nacional sólida al mejor precio. Sin coberturas adicionales.",
                "Cobertura internacional y dental incluida. Prima más alta pero más completa.",
                "Ideal para familias: incluye dental y hasta 3 dependientes sin costo adicional."
            ]
        ),
        [InsuranceType.Home] = new(
            Products: ["Hogar Básico — RC Incluida", "Hogar Total — Contenidos", "Hogar Premium — Constructivo"],
            BaseAnnual: [4_800m, 7_200m, 11_400m],
            BaseDeductible: [3_000m, 5_000m, 2_000m],
            Coverages: [
                """{"valorInmueble":3500000,"contenidos":false,"responsabilidadCivil":1000000,"roboContenidos":false,"inundacion":true,"terremoto":true,"incendio":true}""",
                """{"valorInmueble":3500000,"contenidos":true,"valorContenidos":500000,"responsabilidadCivil":2000000,"roboContenidos":true,"inundacion":true,"terremoto":true,"incendio":true}""",
                """{"valorInmueble":3500000,"contenidos":true,"valorContenidos":800000,"responsabilidadCivil":3000000,"roboContenidos":true,"inundacion":true,"terremoto":true,"incendio":true,"reconstruccionTotal":true,"valorConstructivo":true}"""
            ],
            Reasons: [
                "Protege la estructura al menor costo. No incluye contenidos.",
                "Incluye contenidos y robo. Buen equilibrio para casa habitación.",
                "Cobertura constructiva completa. Ideal para inmuebles de alto valor."
            ]
        ),
        [InsuranceType.Business] = new(
            Products: ["Empresarial PyME — Básico", "Empresarial Integral", "Empresarial Premium"],
            BaseAnnual: [18_000m, 32_400m, 54_000m],
            BaseDeductible: [10_000m, 15_000m, 5_000m],
            Coverages: [
                """{"responsabilidadCivil":3000000,"equipoElectronico":true,"robo":true,"incendio":true,"interrupcionNegocios":false}""",
                """{"responsabilidadCivil":5000000,"equipoElectronico":true,"robo":true,"incendio":true,"interrupcionNegocios":true,"fidelidad":true}""",
                """{"responsabilidadCivil":10000000,"equipoElectronico":true,"robo":true,"incendio":true,"interrupcionNegocios":true,"fidelidad":true,"d&o":true,"cyberRisk":true}"""
            ],
            Reasons: [
                "Cobertura esencial para PyMEs. RC y protección física básica.",
                "Incluye interrupción de negocios y fidelidad. Recomendado para medianas empresas.",
                "Cobertura ejecutiva con D&O y riesgo cibernético. Para empresas con mayor exposición."
            ]
        ),
        [InsuranceType.Travel] = new(
            Products: ["Viajero Básico", "Viajero Plus — Internacional", "Viajero Premium — Global"],
            BaseAnnual: [1_200m, 2_400m, 4_800m],
            BaseDeductible: [0m, 0m, 0m],
            Coverages: [
                """{"gastosMedicos":100000,"cancelacionViaje":false,"perdidaEquipaje":true,"demora":false,"covid":false}""",
                """{"gastosMedicos":500000,"cancelacionViaje":true,"perdidaEquipaje":true,"demora":true,"covid":true,"deportesAventura":false}""",
                """{"gastosMedicos":1000000,"cancelacionViaje":true,"perdidaEquipaje":true,"demora":true,"covid":true,"deportesAventura":true,"evacuacionMedica":true}"""
            ],
            Reasons: [
                "Protección mínima para viajes cortos. Sin cancelación.",
                "Cobertura completa incluyendo COVID y cancelación. Relación precio-valor óptima.",
                "La más completa: evacuación médica y deportes de aventura incluidos."
            ]
        ),
    };

    public ScrapingSimulatorService(IServiceScopeFactory scopeFactory, ILogger<ScrapingSimulatorService> logger, ScrapingControlService control)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _control = control;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[Simulator] ScrapingSimulatorService iniciado — modo desarrollo local");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (_control.IsPaused)
                {
                    _logger.LogDebug("[Simulator] Pausado — esperando...");
                }
                else
                {
                    await ProcessPendingJobsAsync(stoppingToken);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "[Simulator] Error en ciclo de simulación");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessPendingJobsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Tomar hasta 3 jobs en cola
        var jobs = await db.ScrapingJobs
            .Include(j => j.QuotationRequest)
            .Include(j => j.Insurer)
            .Where(j => j.Status == ScrapingJobStatus.Queued)
            .OrderBy(j => j.CreatedAt)
            .Take(3)
            .ToListAsync(ct);

        if (jobs.Count == 0) return;

        _logger.LogInformation("[Simulator] Procesando {Count} job(s) en cola", jobs.Count);

        foreach (var job in jobs)
        {
            // Marcar como Processing
            job.Status = ScrapingJobStatus.Processing;
            job.StartedAt = DateTimeOffset.UtcNow;
            db.ScrapingJobs.Update(job);
            await db.SaveChangesAsync(ct);

            _logger.LogInformation("[Simulator] Job {Id} → Processing ({Ref} / {Insurer})",
                job.Id, job.QuotationRequest?.ReferenceNumber, job.Insurer?.Name);

            // Simular tiempo de scraping (2-6 segundos)
            var delay = Random.Shared.Next(2000, 6000);
            await Task.Delay(delay, ct);

            var quotation = job.QuotationRequest;
            var insurer   = job.Insurer;

            if (quotation is null || insurer is null)
            {
                job.Status = ScrapingJobStatus.Failed;
                job.ErrorMessage = "QuotationRequest o Insurer no encontrado";
                job.CompletedAt = DateTimeOffset.UtcNow;
                job.DurationMs  = delay;
                db.ScrapingJobs.Update(job);
                await db.SaveChangesAsync(ct);
                continue;
            }

            // 10% de probabilidad de fallo para simular errores reales
            if (Random.Shared.Next(10) == 0)
            {
                job.Status = ScrapingJobStatus.Failed;
                job.ErrorMessage = "Timeout: el portal no respondió en el tiempo esperado";
                job.CompletedAt = DateTimeOffset.UtcNow;
                job.DurationMs  = delay;
                db.ScrapingJobs.Update(job);
                await db.SaveChangesAsync(ct);
                _logger.LogWarning("[Simulator] Job {Id} → Failed (simulado)", job.Id);
                continue;
            }

            // Generar resultado según tipo de seguro
            var result = GenerateResult(quotation, insurer);
            if (result is not null)
            {
                // Solo insertar si no existe ya un resultado para esta combinación
                var exists = await db.QuotationResults.AnyAsync(
                    r => r.QuotationRequestId == quotation.Id && r.InsurerId == insurer.Id, ct);

                if (!exists)
                {
                    db.QuotationResults.Add(result);
                    _logger.LogInformation("[Simulator] Resultado generado: {Product} ${Annual}/año",
                        result.ProductName, result.AnnualPremium);
                }
            }

            job.Status      = ScrapingJobStatus.Completed;
            job.CompletedAt = DateTimeOffset.UtcNow;
            job.DurationMs  = delay;
            db.ScrapingJobs.Update(job);

            // Si todos los jobs de esta cotización terminaron, actualizar estado
            await db.SaveChangesAsync(ct);
            await TryCompleteQuotationAsync(db, quotation.Id, ct);
            _logger.LogInformation("[Simulator] Job {Id} → Completed en {Ms}ms", job.Id, delay);
        }
    }

    private static QuotationResult? GenerateResult(QuotationRequest quotation, Insurer insurer)
    {
        var type = quotation.InsuranceType;
        if (!SimConfigs.TryGetValue(type, out var cfg)) return null;

        // Elegir el índice del producto según la aseguradora (determinístico por insurer)
        var idx = Math.Abs(insurer.Id.GetHashCode()) % cfg.Products.Length;

        // Variación de precio ±15% para realismo
        var variation = 0.85m + (decimal)(Random.Shared.NextDouble() * 0.30);
        var annual    = Math.Round(cfg.BaseAnnual[idx] * variation / 100) * 100;
        var monthly   = Math.Round(annual / 12 / 10) * 10;
        var deductible = cfg.BaseDeductible[idx];

        // Score basado en precio relativo (más barato = mejor score)
        var baseScore = 60 + Random.Shared.Next(30);

        return new QuotationResult
        {
            Id = Guid.NewGuid(),
            QuotationRequestId  = quotation.Id,
            InsurerId           = insurer.Id,
            ProductName         = cfg.Products[idx],
            AnnualPremium       = annual,
            MonthlyPremium      = monthly,
            Deductible          = deductible,
            CoverageDetailsJson = cfg.Coverages[idx],
            IsRecommended       = false, // se calculará al finalizar todos los jobs
            RecommendationScore = baseScore,
            RecommendationReason = cfg.Reasons[idx],
            ValidUntil          = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            ScrapedAt           = DateTimeOffset.UtcNow,
            ScreenshotUrl       = null, // Playwright no corre en simulador — se genera en producción
            CreatedBy           = "simulator",
            CreatedAt           = DateTimeOffset.UtcNow
        };
    }

    private static async Task TryCompleteQuotationAsync(AppDbContext db, Guid quotationId, CancellationToken ct)
    {
        var allJobs = await db.ScrapingJobs
            .Where(j => j.QuotationRequestId == quotationId)
            .ToListAsync(ct);

        var allDone = allJobs.All(j =>
            j.Status == ScrapingJobStatus.Completed ||
            j.Status == ScrapingJobStatus.Failed ||
            j.Status == ScrapingJobStatus.DeadLettered);

        if (!allDone) return;

        var quotation = await db.QuotationRequests.FindAsync(new object[] { quotationId }, ct);
        if (quotation is null) return;

        var hasResults = await db.QuotationResults.AnyAsync(r => r.QuotationRequestId == quotationId, ct);

        if (hasResults)
        {
            // Marcar el resultado con mejor score como recomendado
            var allResults = await db.QuotationResults
                .Where(r => r.QuotationRequestId == quotationId)
                .OrderByDescending(r => r.RecommendationScore)
                .ToListAsync(ct);

            // Recalcular scores: el más barato recibe bonus
            var minAnnual = allResults.Min(r => r.AnnualPremium);
            foreach (var r in allResults)
            {
                r.IsRecommended = false;
                // Bonus precio: hasta +15 puntos si es el más barato
                var priceBonus = (int)(15m * (1m - (r.AnnualPremium - minAnnual) / (minAnnual + 1)));
                r.RecommendationScore = Math.Min(99, r.RecommendationScore + priceBonus);
            }

            var best = allResults.OrderByDescending(r => r.RecommendationScore).First();
            best.IsRecommended = true;

            quotation.Status = QuotationStatus.Completed;
            quotation.ProcessingCompletedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            quotation.Status = QuotationStatus.Failed;
        }

        await db.SaveChangesAsync(ct);
    }

    private record SimConfig(
        string[] Products,
        decimal[] BaseAnnual,
        decimal[] BaseDeductible,
        string[] Coverages,
        string[] Reasons
    );
}
