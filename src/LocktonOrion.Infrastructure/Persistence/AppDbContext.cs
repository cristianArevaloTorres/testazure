using LocktonOrion.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LocktonOrion.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<QuotationRequest> QuotationRequests => Set<QuotationRequest>();
    public DbSet<QuotationResult> QuotationResults => Set<QuotationResult>();
    public DbSet<Insurer> Insurers => Set<Insurer>();
    public DbSet<InsuranceProduct> InsuranceProducts => Set<InsuranceProduct>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();
    public DbSet<ScrapingJob> ScrapingJobs => Set<ScrapingJob>();
    public DbSet<ScrapingLog> ScrapingLogs => Set<ScrapingLog>();
    public DbSet<ConversationMessage> ConversationMessages => Set<ConversationMessage>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<IntegrationConfig> IntegrationConfigs => Set<IntegrationConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Soft delete global query filter
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Client>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<QuotationRequest>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Insurer>().HasQueryFilter(e => !e.IsDeleted);

        // Avoid multiple cascade paths from Users to Clients
        modelBuilder.Entity<Client>()
            .HasOne(c => c.User)
            .WithOne(u => u.Client)
            .HasForeignKey<Client>(c => c.UserId)
            .OnDelete(DeleteBehavior.ClientSetNull);
        modelBuilder.Entity<Client>()
            .HasOne(c => c.Advisor)
            .WithMany()
            .HasForeignKey(c => c.AdvisorId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        UpdateAuditFields();
        return await base.SaveChangesAsync(ct);
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries<Domain.Common.AuditableEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = DateTimeOffset.UtcNow;

            entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
}
