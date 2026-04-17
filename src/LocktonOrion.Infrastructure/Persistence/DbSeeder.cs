using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Infrastructure.Persistence;

/// <summary>
/// Pobla la base de datos con datos de prueba idempotentes.
/// Solo inserta si la tabla está vacía.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        logger.LogInformation("Iniciando seed de base de datos...");

        await SeedUsersAsync(db, logger);
        await SeedInsurersAsync(db, logger);
        await SeedClientsAsync(db, logger);
        await SeedQuotationsAsync(db, logger);
        await SeedScrapingJobsAsync(db, logger);
        await SeedQuotationResultsAsync(db, logger);

        // Bulk data para pruebas de paginación
        await SeedBulkClientsAsync(db, logger);
        await SeedBulkQuotationsAsync(db, logger);
        await SeedBulkScrapingJobsAsync(db, logger);
        await SeedBulkResultsAsync(db, logger);

        logger.LogInformation("Seed completado.");
    }

    // ───────────────────────────── USUARIOS ─────────────────────────────

    // Hashes BCrypt (workFactor=12) pre-generados para las contraseñas:
    //   Admin@1234       → hash abajo
    //   Super@1234
    //   Asesor@1234
    //   Cliente@1234
    // Se recalculan automáticamente si quieres cambiar las contraseñas.

    private static async Task SeedUsersAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Users.AnyAsync()) return;

        logger.LogInformation("Insertando usuarios de prueba...");

        var users = new List<User>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0001-000000000001"),
                FirstName = "Alejandro",
                LastName = "García",
                Email = "admin@locktonorion.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", 12),
                Role = UserRole.Admin,
                Phone = "+52 55 1000 0001",
                IsEmailVerified = true,
                IsActive = true,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0001-000000000002"),
                FirstName = "Beatriz",
                LastName = "López",
                Email = "supervisor@locktonorion.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Super@1234", 12),
                Role = UserRole.Supervisor,
                Phone = "+52 55 1000 0002",
                IsEmailVerified = true,
                IsActive = true,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0001-000000000003"),
                FirstName = "Carlos",
                LastName = "Martínez",
                Email = "asesor@locktonorion.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Asesor@1234", 12),
                Role = UserRole.Advisor,
                Phone = "+52 55 1000 0003",
                IsEmailVerified = true,
                IsActive = true,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0001-000000000004"),
                FirstName = "Diana",
                LastName = "Hernández",
                Email = "cliente@locktonorion.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Cliente@1234", 12),
                Role = UserRole.Client,
                Phone = "+52 55 1000 0004",
                IsEmailVerified = true,
                IsActive = true,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            }
        };

        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        logger.LogInformation("4 usuarios insertados.");
    }

    // ───────────────────────────── ASEGURADORAS ─────────────────────────

    private static async Task SeedInsurersAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Insurers.AnyAsync()) return;

        logger.LogInformation("Insertando aseguradoras...");

        var insurers = new List<Insurer>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0002-000000000001"),
                Name = "GNP Seguros",
                ShortName = "GNP",
                Website = "https://www.gnp.com.mx",
                PortalUrl = "https://www.gnp.com.mx/cotiza-tu-seguro",
                ContactEmail = "agentes@gnp.com.mx",
                ContactPhone = "800 900 9009",
                Rating = 4.5m,
                SupportsAutoScraping = true,
                SortOrder = 1,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow,
                Products = new List<InsuranceProduct>
                {
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000001"),
                        Name = "GNP Auto Clásico",
                        Description = "Seguro de auto con cobertura amplia",
                        InsuranceType = InsuranceType.Auto,
                        SortOrder = 1,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000002"),
                        Name = "GNP Vida Futura",
                        Description = "Seguro de vida con ahorro",
                        InsuranceType = InsuranceType.Life,
                        SortOrder = 2,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000003"),
                        Name = "GNP Salud Total",
                        Description = "Gastos médicos mayores",
                        InsuranceType = InsuranceType.Health,
                        SortOrder = 3,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                }
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0002-000000000002"),
                Name = "Quálitas Compañía de Seguros",
                ShortName = "Quálitas",
                Website = "https://www.qualitas.com.mx",
                PortalUrl = "https://www.qualitas.com.mx",
                ContactEmail = "agentes@qualitas.com.mx",
                ContactPhone = "800 288 9000",
                Rating = 4.2m,
                SupportsAutoScraping = true,
                SortOrder = 2,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow,
                Products = new List<InsuranceProduct>
                {
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000004"),
                        Name = "Quálitas Auto Plus",
                        Description = "Seguro de auto amplio",
                        InsuranceType = InsuranceType.Auto,
                        SortOrder = 1,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000005"),
                        Name = "Quálitas Hogar",
                        Description = "Seguro para casa habitación",
                        InsuranceType = InsuranceType.Home,
                        SortOrder = 2,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                }
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0002-000000000003"),
                Name = "AXA Seguros",
                ShortName = "AXA",
                Website = "https://www.axa.com.mx",
                PortalUrl = "https://www.axa.com.mx/seguros",
                ContactEmail = "agentes@axa.com.mx",
                ContactPhone = "800 900 9900",
                Rating = 4.3m,
                SupportsAutoScraping = false,
                SortOrder = 3,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow,
                Products = new List<InsuranceProduct>
                {
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000006"),
                        Name = "AXA Auto Ejecutivo",
                        Description = "Cobertura premium para vehículos",
                        InsuranceType = InsuranceType.Auto,
                        SortOrder = 1,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000007"),
                        Name = "AXA Empresarial",
                        Description = "Seguro para negocios y pymes",
                        InsuranceType = InsuranceType.Business,
                        SortOrder = 2,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new()
                    {
                        Id = Guid.Parse("00000000-0000-0000-0003-000000000008"),
                        Name = "AXA Viajero",
                        Description = "Seguro de viaje nacional e internacional",
                        InsuranceType = InsuranceType.Travel,
                        SortOrder = 3,
                        CreatedBy = "seed",
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                }
            }
        };

        db.Insurers.AddRange(insurers);
        await db.SaveChangesAsync();
        logger.LogInformation("3 aseguradoras y 8 productos insertados.");
    }

    // ───────────────────────────── CLIENTES ─────────────────────────────

    private static async Task SeedClientsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Clients.AnyAsync()) return;

        logger.LogInformation("Insertando clientes de prueba...");

        var advisorId = Guid.Parse("00000000-0000-0000-0001-000000000003");
        var clientUserId = Guid.Parse("00000000-0000-0000-0001-000000000004");

        var clients = new List<Client>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0004-000000000001"),
                FirstName = "Diana",
                LastName = "Hernández",
                Email = "diana.hernandez@email.com",
                Phone = "+52 55 2000 0001",
                BirthDate = new DateOnly(1990, 5, 15),
                Gender = "F",
                Street = "Av. Insurgentes Sur 1234",
                City = "Ciudad de México",
                State = "CDMX",
                PostalCode = "03810",
                Country = "MX",
                UserId = clientUserId,
                AdvisorId = advisorId,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0004-000000000002"),
                FirstName = "Eduardo",
                LastName = "Ramírez",
                Email = "eduardo.ramirez@email.com",
                Phone = "+52 33 3000 0002",
                BirthDate = new DateOnly(1985, 8, 22),
                Gender = "M",
                Street = "Av. Vallarta 500",
                City = "Guadalajara",
                State = "Jalisco",
                PostalCode = "44100",
                Country = "MX",
                AdvisorId = advisorId,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0004-000000000003"),
                FirstName = "Fernanda",
                LastName = "Torres",
                Email = "fernanda.torres@email.com",
                Phone = "+52 81 4000 0003",
                BirthDate = new DateOnly(1992, 12, 3),
                Gender = "F",
                Street = "Blvd. Luis Donaldo Colosio 200",
                City = "Monterrey",
                State = "Nuevo León",
                PostalCode = "64000",
                Country = "MX",
                AdvisorId = advisorId,
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            }
        };

        db.Clients.AddRange(clients);
        await db.SaveChangesAsync();
        logger.LogInformation("3 clientes insertados.");
    }

    // ───────────────────────────── COTIZACIONES ──────────────────────────

    private static async Task SeedQuotationsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.QuotationRequests.AnyAsync()) return;

        logger.LogInformation("Insertando cotizaciones de prueba...");

        var advisorId = Guid.Parse("00000000-0000-0000-0001-000000000003");
        var client1 = Guid.Parse("00000000-0000-0000-0004-000000000001");
        var client2 = Guid.Parse("00000000-0000-0000-0004-000000000002");
        var client3 = Guid.Parse("00000000-0000-0000-0004-000000000003");

        var quotations = new List<QuotationRequest>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000001"),
                ReferenceNumber = "COT-2026-0001",
                ClientId = client1,
                RequestedByUserId = advisorId,
                InsuranceType = InsuranceType.Auto,
                Status = QuotationStatus.Completed,
                RequestDataJson = """{"marca":"Toyota","modelo":"Corolla","anio":2022,"valor":380000,"uso":"particular"}""",
                AdvisorNotes = "Cliente interesado en cobertura amplia",
                ProcessingStartedAt = DateTimeOffset.UtcNow.AddDays(-5),
                ProcessingCompletedAt = DateTimeOffset.UtcNow.AddDays(-5).AddMinutes(3),
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(25),
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000002"),
                ReferenceNumber = "COT-2026-0002",
                ClientId = client2,
                RequestedByUserId = advisorId,
                InsuranceType = InsuranceType.Life,
                Status = QuotationStatus.Processing,
                RequestDataJson = """{"sumaAsegurada":2000000,"plazo":20,"fumador":false}""",
                AdvisorNotes = "Plan para jubilación",
                ProcessingStartedAt = DateTimeOffset.UtcNow.AddHours(-1),
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-1)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000003"),
                ReferenceNumber = "COT-2026-0003",
                ClientId = client3,
                RequestedByUserId = advisorId,
                InsuranceType = InsuranceType.Health,
                Status = QuotationStatus.Pending,
                RequestDataJson = """{"titulares":2,"dependientes":1,"edadPrincipal":32}""",
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0005-000000000004"),
                ReferenceNumber = "COT-2026-0004",
                ClientId = client1,
                RequestedByUserId = advisorId,
                InsuranceType = InsuranceType.Home,
                Status = QuotationStatus.Draft,
                RequestDataJson = """{"valorInmueble":3500000,"ciudad":"CDMX","tipoVivienda":"casa"}""",
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
                CreatedBy = "seed",
                CreatedAt = DateTimeOffset.UtcNow
            }
        };

        db.QuotationRequests.AddRange(quotations);
        await db.SaveChangesAsync();
        logger.LogInformation("4 cotizaciones insertadas.");
    }

    // ───────────────────────────── SCRAPING JOBS ─────────────────────────

    private static async Task SeedScrapingJobsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.ScrapingJobs.AnyAsync()) return;

        logger.LogInformation("Insertando jobs de scraping de prueba...");

        var gnpId      = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var qualitasId = Guid.Parse("00000000-0000-0000-0002-000000000002");
        var axaId      = Guid.Parse("00000000-0000-0000-0002-000000000003");

        var q1 = Guid.Parse("00000000-0000-0000-0005-000000000001"); // COT-2026-0001 Completed
        var q2 = Guid.Parse("00000000-0000-0000-0005-000000000002"); // COT-2026-0002 Processing
        var q3 = Guid.Parse("00000000-0000-0000-0005-000000000003"); // COT-2026-0003 Pending

        var jobs = new List<ScrapingJob>
        {
            // COT-2026-0001 — completados
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000001"),
                QuotationRequestId = q1,
                InsurerId = gnpId,
                Status = ScrapingJobStatus.Completed,
                AttemptNumber = 1, MaxAttempts = 5,
                StartedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CompletedAt = DateTimeOffset.UtcNow.AddDays(-5).AddSeconds(45),
                DurationMs = 45000,
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000002"),
                QuotationRequestId = q1,
                InsurerId = qualitasId,
                Status = ScrapingJobStatus.Completed,
                AttemptNumber = 1, MaxAttempts = 5,
                StartedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CompletedAt = DateTimeOffset.UtcNow.AddDays(-5).AddSeconds(62),
                DurationMs = 62000,
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000003"),
                QuotationRequestId = q1,
                InsurerId = axaId,
                Status = ScrapingJobStatus.Failed,
                AttemptNumber = 3, MaxAttempts = 5,
                StartedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CompletedAt = DateTimeOffset.UtcNow.AddDays(-5).AddSeconds(30),
                DurationMs = 30000,
                ErrorMessage = "Timeout: el portal de AXA no respondió en 30s",
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            // COT-2026-0002 — en proceso
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000004"),
                QuotationRequestId = q2,
                InsurerId = gnpId,
                Status = ScrapingJobStatus.Processing,
                AttemptNumber = 1, MaxAttempts = 5,
                StartedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000005"),
                QuotationRequestId = q2,
                InsurerId = qualitasId,
                Status = ScrapingJobStatus.Queued,
                AttemptNumber = 1, MaxAttempts = 5,
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
            },
            // COT-2026-0003 — en cola
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000006"),
                QuotationRequestId = q3,
                InsurerId = gnpId,
                Status = ScrapingJobStatus.Queued,
                AttemptNumber = 1, MaxAttempts = 5,
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0006-000000000007"),
                QuotationRequestId = q3,
                InsurerId = axaId,
                Status = ScrapingJobStatus.Queued,
                AttemptNumber = 1, MaxAttempts = 5,
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow
            },
        };

        db.ScrapingJobs.AddRange(jobs);
        await db.SaveChangesAsync();
        logger.LogInformation("7 jobs de scraping insertados.");
    }

    // ───────────────────────────── RESULTADOS DE COTIZACIÓN ──────────────

    private static async Task SeedQuotationResultsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.QuotationResults.AnyAsync()) return;

        logger.LogInformation("Insertando resultados de cotización de prueba...");

        var q1 = Guid.Parse("00000000-0000-0000-0005-000000000001"); // COT-2026-0001 Auto - Completed
        var gnpId      = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var qualitasId = Guid.Parse("00000000-0000-0000-0002-000000000002");
        var axaId      = Guid.Parse("00000000-0000-0000-0002-000000000003");

        var results = new List<QuotationResult>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0007-000000000001"),
                QuotationRequestId = q1,
                InsurerId = gnpId,
                ProductName = "GNP Auto Clásico — Amplia",
                AnnualPremium  = 12_480m,
                MonthlyPremium = 1_040m,
                Deductible     = 5_000m,
                IsRecommended  = true,
                RecommendationScore = 87,
                RecommendationReason = "Mejor equilibrio precio-cobertura. Incluye asistencia vial 24/7 y cobertura de robo total.",
                CoverageDetailsJson = """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":true,"responsabilidadCivil":3000000,"gastosMedicos":200000,"asistenciaVial":true,"autoSustituto":15,"cristales":true,"equipo_especial":false}""",
                ValidUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                ScrapedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0007-000000000002"),
                QuotationRequestId = q1,
                InsurerId = qualitasId,
                ProductName = "Quálitas Auto Plus — Amplia",
                AnnualPremium  = 10_920m,
                MonthlyPremium = 910m,
                Deductible     = 8_000m,
                IsRecommended  = false,
                RecommendationScore = 74,
                RecommendationReason = "Prima anual más baja, pero deducible mayor y sin auto sustituto.",
                CoverageDetailsJson = """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":false,"responsabilidadCivil":2000000,"gastosMedicos":100000,"asistenciaVial":true,"autoSustituto":0,"cristales":false,"equipo_especial":false}""",
                ValidUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                ScrapedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0007-000000000003"),
                QuotationRequestId = q1,
                InsurerId = axaId,
                ProductName = "AXA Auto Ejecutivo — Premium",
                AnnualPremium  = 15_960m,
                MonthlyPremium = 1_330m,
                Deductible     = 3_000m,
                IsRecommended  = false,
                RecommendationScore = 82,
                RecommendationReason = "Cobertura más completa y menor deducible, pero prima anual más alta.",
                CoverageDetailsJson = """{"dañosMateriales":true,"roboTotal":true,"roboParcialesPiezas":true,"responsabilidadCivil":5000000,"gastosMedicos":300000,"asistenciaVial":true,"autoSustituto":30,"cristales":true,"equipo_especial":true}""",
                ValidUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                ScrapedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CreatedBy = "seed", CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
            },
        };

        db.QuotationResults.AddRange(results);
        await db.SaveChangesAsync();
        logger.LogInformation("3 resultados de cotización insertados (COT-2026-0001).");
    }

    // ─────────────────────────── BULK: CLIENTES (4-30) ──────────────────

    private static async Task SeedBulkClientsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Clients.CountAsync() >= 30) return;

        logger.LogInformation("Insertando clientes adicionales en volumen...");

        var advisorId = Guid.Parse("00000000-0000-0000-0001-000000000003");

        var raw = new (string Fn, string Ln, string Email, string City, string State, string Cp, string G, int Yr, int Mo, int Dy)[]
        {
            ("Gabriela",  "Reyes",    "gabriela.reyes@email.com",    "Ciudad de México",  "CDMX",              "06600", "F", 1988,  3, 12),
            ("Héctor",    "Morales",  "hector.morales@email.com",    "Monterrey",         "Nuevo León",        "64010", "M", 1982,  7, 25),
            ("Isabel",    "Castillo", "isabel.castillo@email.com",   "Guadalajara",       "Jalisco",           "44200", "F", 1995,  1,  8),
            ("Jorge",     "Vargas",   "jorge.vargas@email.com",      "Puebla",            "Puebla",            "72000", "M", 1979, 11, 30),
            ("Karen",     "Jiménez",  "karen.jimenez@email.com",     "Querétaro",         "Querétaro",         "76000", "F", 1991,  6, 14),
            ("Luis",      "Peña",     "luis.pena@email.com",         "Tijuana",           "Baja California",   "22000", "M", 1986,  9,  3),
            ("María",     "Gutiérrez","maria.gutierrez@email.com",   "Ciudad de México",  "CDMX",              "11520", "F", 1993,  4, 22),
            ("Nicolás",   "Flores",   "nicolas.flores@email.com",    "Mérida",            "Yucatán",           "97000", "M", 1975, 12, 17),
            ("Olivia",    "Cruz",     "olivia.cruz@email.com",       "Cancún",            "Quintana Roo",      "77500", "F", 1998,  2,  5),
            ("Pablo",     "Mendoza",  "pablo.mendoza@email.com",     "Veracruz",          "Veracruz",          "91700", "M", 1983,  8, 19),
            ("Quetzali",  "Soto",     "quetzali.soto@email.com",     "Oaxaca",            "Oaxaca",            "68000", "F", 1990, 10, 28),
            ("Roberto",   "Aguilar",  "roberto.aguilar@email.com",   "Ciudad de México",  "CDMX",              "03100", "M", 1977,  5,  7),
            ("Sandra",    "Ríos",     "sandra.rios@email.com",       "León",              "Guanajuato",        "37000", "F", 1994,  3, 15),
            ("Tomás",     "Navarro",  "tomas.navarro@email.com",     "Saltillo",          "Coahuila",          "25000", "M", 1980,  7, 11),
            ("Úrsula",    "Paredes",  "ursula.paredes@email.com",    "Culiacán",          "Sinaloa",           "80000", "F", 1987,  1, 24),
            ("Vicente",   "Ramírez",  "vicente.ramirez@email.com",   "Hermosillo",        "Sonora",            "83000", "M", 1973,  9, 30),
            ("Wendy",     "López",    "wendy.lopez@email.com",       "Chihuahua",         "Chihuahua",         "31000", "F", 1996,  6,  8),
            ("Xavier",    "Torres",   "xavier.torres@email.com",     "Morelia",           "Michoacán",         "58000", "M", 1984, 11, 22),
            ("Yolanda",   "Díaz",     "yolanda.diaz@email.com",      "Aguascalientes",    "Aguascalientes",    "20000", "F", 1989,  4, 16),
            ("Zaira",     "Martínez", "zaira.martinez@email.com",    "Toluca",            "Estado de México",  "50000", "F", 1992,  8,  3),
            ("Arturo",    "Vega",     "arturo.vega@email.com",       "Ciudad de México",  "CDMX",              "11000", "M", 1981, 12, 27),
            ("Brenda",    "Salinas",  "brenda.salinas@email.com",    "San Luis Potosí",   "San Luis Potosí",   "78000", "F", 1997,  2, 14),
            ("César",     "Fuentes",  "cesar.fuentes@email.com",     "Tampico",           "Tamaulipas",        "89000", "M", 1978,  7,  9),
            ("Daniela",   "Ortiz",    "daniela.ortiz@email.com",     "Mazatlán",          "Sinaloa",           "82000", "F", 1993,  5, 18),
            ("Ernesto",   "Cabrera",  "ernesto.cabrera@email.com",   "Tepic",             "Nayarit",           "63000", "M", 1985, 10, 31),
            ("Fátima",    "Méndez",   "fatima.mendez@email.com",     "Ciudad de México",  "CDMX",              "07000", "F", 1991,  3, 25),
            ("Gonzalo",   "Lara",     "gonzalo.lara@email.com",      "Xalapa",            "Veracruz",          "91000", "M", 1976,  8, 12),
        };

        var clients = raw.Select((r, i) => new Client
        {
            Id         = Guid.Parse($"00000000-0000-0000-0004-{(i + 4):D12}"),
            FirstName  = r.Fn,
            LastName   = r.Ln,
            Email      = r.Email,
            Phone      = $"+52 55 2{(i + 4):D3} {((i + 4) * 3 + 100):D4}",
            BirthDate  = new DateOnly(r.Yr, r.Mo, r.Dy),
            Gender     = r.G,
            Street     = $"Av. Principal {(i + 1) * 100}",
            City       = r.City,
            State      = r.State,
            PostalCode = r.Cp,
            Country    = "MX",
            AdvisorId  = advisorId,
            CreatedBy  = "seed",
            CreatedAt  = DateTimeOffset.UtcNow.AddDays(-(i * 7)),
        }).ToList();

        db.Clients.AddRange(clients);
        await db.SaveChangesAsync();
        logger.LogInformation($"{clients.Count} clientes adicionales insertados.");
    }

    // ──────────────────────── BULK: COTIZACIONES (5-50) ─────────────────

    private static async Task SeedBulkQuotationsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.QuotationRequests.CountAsync() >= 50) return;

        logger.LogInformation("Insertando cotizaciones en volumen...");

        var advisorId    = Guid.Parse("00000000-0000-0000-0001-000000000003");
        var allClientIds = Enumerable.Range(1, 30)
            .Select(i => Guid.Parse($"00000000-0000-0000-0004-{i:D12}"))
            .ToArray();

        var rdByType = new Dictionary<InsuranceType, string[]>
        {
            [InsuranceType.Auto] =
            [
                """{"marca":"Toyota","modelo":"Corolla","anio":2022,"valor":380000,"uso":"particular"}""",
                """{"marca":"Honda","modelo":"Civic","anio":2021,"valor":350000,"uso":"particular"}""",
                """{"marca":"Nissan","modelo":"Sentra","anio":2023,"valor":320000,"uso":"particular"}""",
                """{"marca":"Volkswagen","modelo":"Jetta","anio":2020,"valor":290000,"uso":"particular"}""",
                """{"marca":"Chevrolet","modelo":"Aveo","anio":2022,"valor":210000,"uso":"particular"}""",
                """{"marca":"Kia","modelo":"Rio","anio":2021,"valor":280000,"uso":"ejecutivo"}""",
                """{"marca":"Ford","modelo":"Escape","anio":2020,"valor":450000,"uso":"particular"}""",
                """{"marca":"Mazda","modelo":"3","anio":2023,"valor":420000,"uso":"ejecutivo"}""",
            ],
            [InsuranceType.Life] =
            [
                """{"sumaAsegurada":1000000,"plazo":15,"fumador":false}""",
                """{"sumaAsegurada":2000000,"plazo":20,"fumador":false}""",
                """{"sumaAsegurada":3000000,"plazo":25,"fumador":true}""",
                """{"sumaAsegurada":5000000,"plazo":30,"fumador":false}""",
                """{"sumaAsegurada":1500000,"plazo":10,"fumador":false}""",
            ],
            [InsuranceType.Health] =
            [
                """{"titulares":1,"dependientes":0,"edadPrincipal":28}""",
                """{"titulares":1,"dependientes":2,"edadPrincipal":35}""",
                """{"titulares":2,"dependientes":1,"edadPrincipal":42}""",
                """{"titulares":2,"dependientes":3,"edadPrincipal":38}""",
                """{"titulares":1,"dependientes":1,"edadPrincipal":50}""",
            ],
            [InsuranceType.Home] =
            [
                """{"valorInmueble":2500000,"ciudad":"CDMX","tipoVivienda":"departamento"}""",
                """{"valorInmueble":4000000,"ciudad":"Monterrey","tipoVivienda":"casa"}""",
                """{"valorInmueble":3500000,"ciudad":"Guadalajara","tipoVivienda":"casa"}""",
                """{"valorInmueble":1800000,"ciudad":"Puebla","tipoVivienda":"departamento"}""",
                """{"valorInmueble":6000000,"ciudad":"CDMX","tipoVivienda":"casa"}""",
            ],
            [InsuranceType.Business] =
            [
                """{"giroNegocio":"restaurante","empleados":8,"valorActivos":1500000}""",
                """{"giroNegocio":"comercio","empleados":15,"valorActivos":5000000}""",
                """{"giroNegocio":"manufactura","empleados":50,"valorActivos":20000000}""",
                """{"giroNegocio":"servicios","empleados":5,"valorActivos":800000}""",
                """{"giroNegocio":"consultoria","empleados":3,"valorActivos":500000}""",
            ],
            [InsuranceType.Travel] =
            [
                """{"destino":"Europa","duracionDias":14,"viajeros":2}""",
                """{"destino":"Estados Unidos","duracionDias":7,"viajeros":1}""",
                """{"destino":"Asia","duracionDias":21,"viajeros":2}""",
                """{"destino":"Latinoamérica","duracionDias":10,"viajeros":4}""",
                """{"destino":"Nacional","duracionDias":5,"viajeros":2}""",
            ],
        };

        var quotations = new List<QuotationRequest>();
        for (int i = 0; i < 46; i++)   // índices 0-45  →  Q005-Q050
        {
            var qNum      = i + 5;
            var type      = (InsuranceType)(i % 6);
            var status    = BulkStatus(i);
            var clientId  = allClientIds[i % 30];
            var daysAgo   = (46 - i) * 4;
            var createdAt = DateTimeOffset.UtcNow.AddDays(-daysAgo);
            var year      = createdAt.Year;
            var rdArr     = rdByType[type];

            var q = new QuotationRequest
            {
                Id                = Guid.Parse($"00000000-0000-0000-0005-{qNum:D12}"),
                ReferenceNumber   = $"COT-{year}-{qNum:D4}",
                ClientId          = clientId,
                RequestedByUserId = advisorId,
                InsuranceType     = type,
                Status            = status,
                RequestDataJson   = rdArr[i % rdArr.Length],
                ExpiresAt         = createdAt.AddDays(30),
                CreatedBy         = "seed",
                CreatedAt         = createdAt,
            };

            if (status is QuotationStatus.Processing or QuotationStatus.Completed
                       or QuotationStatus.Failed     or QuotationStatus.PartiallyCompleted)
                q.ProcessingStartedAt = createdAt.AddMinutes(5);

            if (status is QuotationStatus.Completed or QuotationStatus.PartiallyCompleted)
                q.ProcessingCompletedAt = createdAt.AddMinutes(8);

            if (status == QuotationStatus.Failed)
                q.LastErrorMessage = "Tiempo de espera agotado al consultar portales de aseguradoras.";

            quotations.Add(q);
        }

        db.QuotationRequests.AddRange(quotations);
        await db.SaveChangesAsync();
        logger.LogInformation($"{quotations.Count} cotizaciones adicionales insertadas.");
    }

    // ────────────────────── BULK: SCRAPING JOBS (Q005-Q050) ─────────────

    private static async Task SeedBulkScrapingJobsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.ScrapingJobs.CountAsync() >= 30) return;

        logger.LogInformation("Insertando scraping jobs en volumen...");

        var gnpId      = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var qualitasId = Guid.Parse("00000000-0000-0000-0002-000000000002");
        var axaId      = Guid.Parse("00000000-0000-0000-0002-000000000003");
        var insurers   = new[] { gnpId, qualitasId, axaId };

        var jobs  = new List<ScrapingJob>();
        int jobId = 8;   // 1-7 ya existen

        for (int i = 0; i < 46; i++)
        {
            var qNum    = i + 5;
            var qId     = Guid.Parse($"00000000-0000-0000-0005-{qNum:D12}");
            var qStatus = BulkStatus(i);
            var daysAgo = (46 - i) * 4;
            var created = DateTimeOffset.UtcNow.AddDays(-daysAgo);

            // Draft y Cancelled no tienen jobs de scraping
            if (qStatus is QuotationStatus.Draft or QuotationStatus.Cancelled) continue;

            for (int j = 0; j < 3; j++)
            {
                ScrapingJobStatus jobStatus;

                if (qStatus is QuotationStatus.Completed or QuotationStatus.PartiallyCompleted)
                    // ~1 de cada 5 tiene un job fallido en la tercera aseguradora
                    jobStatus = (j == 2 && i % 5 == 0) ? ScrapingJobStatus.Failed : ScrapingJobStatus.Completed;
                else if (qStatus == QuotationStatus.Processing)
                    jobStatus = j == 0 ? ScrapingJobStatus.Processing : ScrapingJobStatus.Queued;
                else if (qStatus == QuotationStatus.Failed)
                    jobStatus = ScrapingJobStatus.Failed;
                else  // Pending, Expired
                    jobStatus = ScrapingJobStatus.Queued;

                var started   = (jobStatus is ScrapingJobStatus.Processing
                                           or ScrapingJobStatus.Completed
                                           or ScrapingJobStatus.Failed)
                                ? created.AddMinutes(5 + j)
                                : (DateTimeOffset?)null;

                var completed = (jobStatus is ScrapingJobStatus.Completed or ScrapingJobStatus.Failed)
                                ? started?.AddSeconds(30 + j * 10)
                                : (DateTimeOffset?)null;

                jobs.Add(new ScrapingJob
                {
                    Id                 = Guid.Parse($"00000000-0000-0000-0006-{jobId:D12}"),
                    QuotationRequestId = qId,
                    InsurerId          = insurers[j],
                    Status             = jobStatus,
                    AttemptNumber      = jobStatus == ScrapingJobStatus.Failed ? 3 : 1,
                    MaxAttempts        = 5,
                    StartedAt          = started,
                    CompletedAt        = completed,
                    DurationMs         = jobStatus == ScrapingJobStatus.Completed ? (long?)(30000 + j * 8000) : null,
                    ErrorMessage       = jobStatus == ScrapingJobStatus.Failed
                                         ? "Timeout: el portal de la aseguradora no respondió en 30 s"
                                         : null,
                    CreatedBy          = "seed",
                    CreatedAt          = created,
                });
                jobId++;
            }
        }

        db.ScrapingJobs.AddRange(jobs);
        await db.SaveChangesAsync();
        logger.LogInformation($"{jobs.Count} scraping jobs adicionales insertados.");
    }

    // ────────────────────── BULK: RESULTADOS (Q005-Q024 completadas) ────

    private static async Task SeedBulkResultsAsync(AppDbContext db, ILogger logger)
    {
        if (await db.QuotationResults.CountAsync() >= 10) return;

        logger.LogInformation("Insertando resultados de cotización en volumen...");

        var gnpId      = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var qualitasId = Guid.Parse("00000000-0000-0000-0002-000000000002");
        var axaId      = Guid.Parse("00000000-0000-0000-0002-000000000003");

        // Precios base anuales por tipo [GNP, Quálitas, AXA]
        var basePrices = new Dictionary<InsuranceType, decimal[]>
        {
            [InsuranceType.Auto]     = [12_400, 10_800, 15_600],
            [InsuranceType.Life]     = [ 9_200,  8_100, 11_500],
            [InsuranceType.Health]   = [18_600, 15_200, 23_400],
            [InsuranceType.Home]     = [ 5_400,  4_700,  6_800],
            [InsuranceType.Business] = [28_000, 22_500, 36_000],
            [InsuranceType.Travel]   = [ 2_800,  2_200,  3_600],
        };

        // Deducibles por tipo [GNP, Quálitas, AXA]
        var deductibles = new Dictionary<InsuranceType, decimal[]>
        {
            [InsuranceType.Auto]     = [5_000, 8_000, 3_000],
            [InsuranceType.Life]     = [    0,     0,     0],
            [InsuranceType.Health]   = [5_000, 8_000, 2_000],
            [InsuranceType.Home]     = [3_000, 5_000, 2_000],
            [InsuranceType.Business] = [10_000,15_000, 5_000],
            [InsuranceType.Travel]   = [    0,     0,     0],
        };

        var insurerIds   = new[] { gnpId, qualitasId, axaId };
        var insurerNames = new[] { "GNP", "Quálitas", "AXA" };
        var tiers        = new[] { "Amplia", "Plus", "Premium" };
        var baseScores   = new[] { 87, 74, 82 };
        var reasons      = new[]
        {
            "Mejor equilibrio precio-cobertura con asistencia vial 24/7 incluida.",
            "Prima anual más baja aunque con deducible mayor y coberturas básicas.",
            "Cobertura más amplia y menor deducible; prima premium.",
        };

        var results  = new List<QuotationResult>();
        int resultId = 4;   // 1-3 ya existen

        // Solo las primeras 20 cotizaciones bulk tienen Status = Completed
        for (int i = 0; i < 20; i++)
        {
            var qNum    = i + 5;
            var qId     = Guid.Parse($"00000000-0000-0000-0005-{qNum:D12}");
            var type    = (InsuranceType)(i % 6);
            var daysAgo = (46 - i) * 4;
            var scraped = DateTimeOffset.UtcNow.AddDays(-daysAgo).AddMinutes(8);

            if (!basePrices.ContainsKey(type)) type = InsuranceType.Auto;

            var prices = basePrices[type];
            var deds   = deductibles[type];

            // Rotar cuál aseguradora es "recomendada" para variedad
            var bestIdx = i % 3;

            for (int j = 0; j < 3; j++)
            {
                // Variación de precio ±15 %
                var variation = 1.0m + (i * 0.02m - 0.10m) + (j * 0.03m);
                var annual    = Math.Round(prices[j] * variation / 100m, 0) * 100m;
                var monthly   = Math.Round(annual / 12m / 10m, 0) * 10m;

                results.Add(new QuotationResult
                {
                    Id                  = Guid.Parse($"00000000-0000-0000-0007-{resultId:D12}"),
                    QuotationRequestId  = qId,
                    InsurerId           = insurerIds[j],
                    ProductName         = $"{insurerNames[j]} {type} — {tiers[j]}",
                    AnnualPremium       = annual,
                    MonthlyPremium      = monthly,
                    Deductible          = deds[j],
                    IsRecommended       = j == bestIdx,
                    RecommendationScore = baseScores[j] + (i % 5) - 2,
                    RecommendationReason = reasons[j],
                    CoverageDetailsJson = BulkCoverageJson(type, j),
                    IsValid             = true,
                    ValidUntil          = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30 - daysAgo / 4)),
                    ScrapedAt           = scraped.AddSeconds(j * 15),
                    CreatedBy           = "seed",
                    CreatedAt           = scraped.AddSeconds(j * 15),
                });
                resultId++;
            }
        }

        db.QuotationResults.AddRange(results);
        await db.SaveChangesAsync();
        logger.LogInformation($"{results.Count} resultados de cotización adicionales insertados.");
    }

    // ───────────────────────────── HELPERS ──────────────────────────────

    /// <summary>Determina el QuotationStatus para los registros bulk según su índice (0-45).</summary>
    private static QuotationStatus BulkStatus(int idx) => idx switch
    {
        < 20 => QuotationStatus.Completed,
        < 25 => QuotationStatus.Processing,
        < 32 => QuotationStatus.Pending,
        < 39 => QuotationStatus.Draft,
        < 43 => QuotationStatus.Cancelled,
        _    => QuotationStatus.Failed,
    };

    /// <summary>JSON de coberturas por tipo de seguro y variante (0=GNP, 1=Quálitas, 2=AXA).</summary>
    private static string BulkCoverageJson(InsuranceType type, int v) => type switch
    {
        InsuranceType.Auto when v == 0 => """{"dañosMateriales":true,"roboTotal":true,"responsabilidadCivil":3000000,"gastosMedicos":200000,"asistenciaVial":true,"autoSustituto":15,"cristales":true}""",
        InsuranceType.Auto when v == 1 => """{"dañosMateriales":true,"roboTotal":true,"responsabilidadCivil":2000000,"gastosMedicos":100000,"asistenciaVial":true,"autoSustituto":0,"cristales":false}""",
        InsuranceType.Auto             => """{"dañosMateriales":true,"roboTotal":true,"responsabilidadCivil":5000000,"gastosMedicos":300000,"asistenciaVial":true,"autoSustituto":30,"cristales":true}""",

        InsuranceType.Life when v == 0 => """{"fallecimiento":true,"invalidezTotal":true,"enfermedadGrave":false,"sumaAsegurada":1000000}""",
        InsuranceType.Life when v == 1 => """{"fallecimiento":true,"invalidezTotal":true,"enfermedadGrave":true,"sumaAsegurada":1500000}""",
        InsuranceType.Life             => """{"fallecimiento":true,"invalidezTotal":true,"enfermedadGrave":true,"ahorro":true,"sumaAsegurada":2000000}""",

        InsuranceType.Health when v == 0 => """{"sumaAsegurada":3000000,"maternidad":true,"dental":false,"vision":false,"hospitalaria":true}""",
        InsuranceType.Health when v == 1 => """{"sumaAsegurada":2000000,"maternidad":false,"dental":false,"vision":false,"hospitalaria":true}""",
        InsuranceType.Health             => """{"sumaAsegurada":5000000,"maternidad":true,"dental":true,"vision":true,"hospitalaria":true}""",

        InsuranceType.Home when v == 0 => """{"incendio":true,"robo":true,"responsabilidadCivil":500000,"inundacion":false,"rotura":true}""",
        InsuranceType.Home when v == 1 => """{"incendio":true,"robo":true,"responsabilidadCivil":300000,"inundacion":false,"rotura":false}""",
        InsuranceType.Home             => """{"incendio":true,"robo":true,"responsabilidadCivil":1000000,"inundacion":true,"cristales":true,"rotura":true}""",

        InsuranceType.Business when v == 0 => """{"incendio":true,"robo":true,"responsabilidadCivil":2000000,"interrupcionNegocio":false,"equipoElectronico":true}""",
        InsuranceType.Business when v == 1 => """{"incendio":true,"robo":true,"responsabilidadCivil":1000000,"interrupcionNegocio":false,"equipoElectronico":false}""",
        InsuranceType.Business             => """{"incendio":true,"robo":true,"responsabilidadCivil":5000000,"interrupcionNegocio":true,"equipoElectronico":true}""",

        InsuranceType.Travel when v == 0 => """{"asistenciaMedica":true,"cancelacion":true,"equipaje":true,"responsabilidadCivil":100000}""",
        InsuranceType.Travel when v == 1 => """{"asistenciaMedica":true,"cancelacion":false,"equipaje":false,"responsabilidadCivil":50000}""",
        InsuranceType.Travel             => """{"asistenciaMedica":true,"cancelacion":true,"equipaje":true,"responsabilidadCivil":200000,"deportesExtremos":true}""",

        _ => "{}",
    };
}
