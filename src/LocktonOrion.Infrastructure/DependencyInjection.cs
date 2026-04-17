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
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IQuotationRepository, QuotationRepository>();

        // Security
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IEncryptionService, EncryptionService>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();

        // Messaging
        services.AddSingleton<IServiceBusPublisher, ServiceBusPublisher>();

        // AI
        services.AddHttpClient<IAIService, ClaudeAIService>();

        // Scraping
        services.AddScoped<IPlaywrightScrapingService, PlaywrightScrapingService>();

        // Control del simulador (singleton para compartir estado entre controller y BackgroundService)
        services.AddSingleton<ScrapingControlService>();

        // Simulador de scraping local (reemplaza Azure Functions en desarrollo)
        var env = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
        if (env == "Development")
            services.AddHostedService<ScrapingSimulatorService>();

        return services;
    }
}
