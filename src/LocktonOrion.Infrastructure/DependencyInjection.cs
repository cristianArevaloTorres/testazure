using LocktonOrion.Domain.Interfaces.Repositories;
using LocktonOrion.Domain.Interfaces.Services;
using LocktonOrion.Infrastructure.AI;
using LocktonOrion.Infrastructure.Messaging;
using LocktonOrion.Infrastructure.Persistence;
using LocktonOrion.Infrastructure.Persistence.Repositories;
using LocktonOrion.Infrastructure.Scraping;
using LocktonOrion.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace LocktonOrion.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database – choose provider based on connection string prefix
        var connStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        if (connStr.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(connStr));
        }
        else
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    connStr,
                    sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));
        }

        // Repositories
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IQuotationRepository, QuotationRepository>();

        // Security
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IEncryptionService, EncryptionService>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();

        // Messaging – optional: skip if connection string is missing
        var sbConnectionString = configuration["AzureServiceBus:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(sbConnectionString))
        {
            services.AddSingleton<IServiceBusPublisher, ServiceBusPublisher>();
        }
        else
        {
            services.AddSingleton<IServiceBusPublisher, NullServiceBusPublisher>();
        }

        // AI
        services.AddHttpClient<IAIService, ClaudeAIService>();

        // Scraping
        services.AddScoped<IPlaywrightScrapingService, PlaywrightScrapingService>();

        // Control del simulador (singleton para compartir estado entre controller y BackgroundService)
        services.AddSingleton<ScrapingControlService>();

        // Simulador de scraping (activo en todos los environments)
        services.AddHostedService<ScrapingSimulatorService>();

        return services;
    }
}
