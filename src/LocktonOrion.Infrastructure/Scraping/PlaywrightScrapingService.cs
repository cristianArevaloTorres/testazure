using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;

namespace LocktonOrion.Infrastructure.Scraping;

public interface IPlaywrightScrapingService
{
    Task<ScrapingResult> ScrapeInsurerAsync(
        Guid quotationRequestId,
        Guid insurerId,
        string insurerPortalUrl,
        string scrapingConfigJson,
        object requestData,
        CancellationToken ct = default);
}

public record ScrapingResult(
    bool Success,
    decimal? AnnualPremium,
    decimal? MonthlyPremium,
    decimal? Deductible,
    string? ProductName,
    string? CoverageJson,
    DateOnly? ValidUntil,
    string? PolicyNumber,
    string? ErrorMessage,
    string? ScreenshotUrl = null
);

public class PlaywrightScrapingService : IPlaywrightScrapingService
{
    private readonly ILogger<PlaywrightScrapingService> _logger;
    private readonly IWebHostEnvironment? _env;

    public PlaywrightScrapingService(ILogger<PlaywrightScrapingService> logger, IWebHostEnvironment? env = null)
    {
        _logger = logger;
        _env = env;
    }

    public async Task<ScrapingResult> ScrapeInsurerAsync(
        Guid quotationRequestId,
        Guid insurerId,
        string insurerPortalUrl,
        string scrapingConfigJson,
        object requestData,
        CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Starting Playwright scraping for quotation {QuotationId}, insurer portal: {Url}",
            quotationRequestId, insurerPortalUrl);

        try
        {
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = true,
                Args = ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            var context = await browser.NewContextAsync(new BrowserNewContextOptions
            {
                UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 },
                Locale = "es-MX",
                TimezoneId = "America/Mexico_City"
            });

            var page = await context.NewPageAsync();
            page.SetDefaultTimeout(30_000);

            // Navigate to insurer portal
            await page.GotoAsync(insurerPortalUrl, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle,
                Timeout = 30_000
            });

            // Capturar screenshot como evidencia del scraping
            string? screenshotUrl = null;
            try
            {
                var screenshotDir = _env is not null
                    ? Path.Combine(_env.WebRootPath, "screenshots")
                    : Path.Combine(AppContext.BaseDirectory, "wwwroot", "screenshots");

                Directory.CreateDirectory(screenshotDir);
                var fileName = $"{quotationRequestId}_{insurerId}_{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.png";
                var filePath = Path.Combine(screenshotDir, fileName);

                await page.ScreenshotAsync(new PageScreenshotOptions
                {
                    Path = filePath,
                    FullPage = false
                });

                screenshotUrl = $"/screenshots/{fileName}";
                _logger.LogInformation("Screenshot guardado: {Path}", screenshotUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo guardar screenshot para quotation {Id}", quotationRequestId);
            }

            // TODO: Implement insurer-specific scraping logic
            // This is a template – each insurer needs its own adapter
            // The scrapingConfigJson contains selectors and flow steps

            _logger.LogInformation("Scraping completed successfully for quotation {QuotationId}", quotationRequestId);

            // Placeholder result – real implementation uses insurer-specific adapters
            return new ScrapingResult(
                Success: true,
                AnnualPremium: 12500.00m,
                MonthlyPremium: 1041.67m,
                Deductible: 5000.00m,
                ProductName: "Seguro Auto Amplia",
                CoverageJson: """{"material":"Amplia","medical":200000,"legal":500000,"roadAssistance":true}""",
                ValidUntil: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(90)),
                PolicyNumber: null,
                ErrorMessage: null,
                ScreenshotUrl: screenshotUrl
            );
        }
        catch (PlaywrightException ex)
        {
            _logger.LogError(ex, "Playwright error scraping quotation {QuotationId}", quotationRequestId);
            return new ScrapingResult(
                Success: false, null, null, null, null, null, null, null,
                ErrorMessage: $"Browser error: {ex.Message}");
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Timeout scraping quotation {QuotationId}", quotationRequestId);
            return new ScrapingResult(
                Success: false, null, null, null, null, null, null, null,
                ErrorMessage: $"Timeout: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error scraping quotation {QuotationId}", quotationRequestId);
            return new ScrapingResult(
                Success: false, null, null, null, null, null, null, null,
                ErrorMessage: ex.Message);
        }
    }
}
