using LocktonOrion.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LocktonOrion.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(512).IsRequired();
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        builder.Property(u => u.RefreshToken).HasMaxLength(512);
        builder.Property(u => u.PasswordResetToken).HasMaxLength(512);
        builder.Property(u => u.CreatedBy).HasMaxLength(256);
        builder.Property(u => u.UpdatedBy).HasMaxLength(256);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.Role);
        builder.HasIndex(u => u.IsActive);
    }
}

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.ToTable("Clients");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(c => c.LastName).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Email).HasMaxLength(256).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(20);
        builder.Property(c => c.RfcEncrypted).HasMaxLength(512);
        builder.Property(c => c.CurpEncrypted).HasMaxLength(512);
        builder.Property(c => c.Gender).HasMaxLength(10);
        builder.Property(c => c.Street).HasMaxLength(200);
        builder.Property(c => c.City).HasMaxLength(100);
        builder.Property(c => c.State).HasMaxLength(100);
        builder.Property(c => c.PostalCode).HasMaxLength(10);
        builder.Property(c => c.Country).HasMaxLength(3).HasDefaultValue("MX");

        builder.HasOne(c => c.User).WithOne(u => u.Client)
            .HasForeignKey<Client>(c => c.UserId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(c => c.Advisor).WithMany()
            .HasForeignKey(c => c.AdvisorId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.Email);
        builder.HasIndex(c => c.AdvisorId);
    }
}

public class QuotationRequestConfiguration : IEntityTypeConfiguration<QuotationRequest>
{
    public void Configure(EntityTypeBuilder<QuotationRequest> builder)
    {
        builder.ToTable("QuotationRequests");
        builder.HasKey(q => q.Id);

        builder.Property(q => q.ReferenceNumber).HasMaxLength(50).IsRequired();
        builder.Property(q => q.InsuranceType).HasConversion<string>().HasMaxLength(20);
        builder.Property(q => q.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(q => q.RequestDataJson).HasColumnType("TEXT");
        builder.Property(q => q.AdvisorNotes).HasMaxLength(2000);
        builder.Property(q => q.InternalNotes).HasMaxLength(2000);
        builder.Property(q => q.LastErrorMessage).HasMaxLength(1000);

        builder.HasOne(q => q.Client).WithMany(c => c.QuotationRequests)
            .HasForeignKey(q => q.ClientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(q => q.RequestedByUser).WithMany(u => u.QuotationRequests)
            .HasForeignKey(q => q.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(q => q.ReferenceNumber).IsUnique();
        builder.HasIndex(q => q.ClientId);
        builder.HasIndex(q => q.Status);
        builder.HasIndex(q => q.CreatedAt);
    }
}

public class QuotationResultConfiguration : IEntityTypeConfiguration<QuotationResult>
{
    public void Configure(EntityTypeBuilder<QuotationResult> builder)
    {
        builder.ToTable("QuotationResults");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ProductName).HasMaxLength(200).IsRequired();
        builder.Property(r => r.AnnualPremium).HasPrecision(18, 2);
        builder.Property(r => r.MonthlyPremium).HasPrecision(18, 2);
        builder.Property(r => r.Deductible).HasPrecision(18, 2);
        builder.Property(r => r.RecommendationScore).HasPrecision(5, 2);
        builder.Property(r => r.CoverageDetailsJson).HasColumnType("TEXT");
        builder.Property(r => r.RecommendationReason).HasMaxLength(500);
        builder.Property(r => r.PolicyNumber).HasMaxLength(100);
        builder.Property(r => r.SourceUrl).HasMaxLength(500);

        builder.HasOne(r => r.QuotationRequest).WithMany(q => q.Results)
            .HasForeignKey(r => r.QuotationRequestId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(r => r.Insurer).WithMany(i => i.QuotationResults)
            .HasForeignKey(r => r.InsurerId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.QuotationRequestId);
        builder.HasIndex(r => r.IsRecommended);
    }
}

public class InsurerConfiguration : IEntityTypeConfiguration<Insurer>
{
    public void Configure(EntityTypeBuilder<Insurer> builder)
    {
        builder.ToTable("Insurers");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name).HasMaxLength(200).IsRequired();
        builder.Property(i => i.ShortName).HasMaxLength(50).IsRequired();
        builder.Property(i => i.LogoUrl).HasMaxLength(500);
        builder.Property(i => i.Website).HasMaxLength(500);
        builder.Property(i => i.PortalUrl).HasMaxLength(500);
        builder.Property(i => i.Rating).HasPrecision(3, 1);
        builder.Property(i => i.ScrapingConfigJson).HasColumnType("TEXT");
        builder.Property(i => i.ContactEmail).HasMaxLength(256);
        builder.Property(i => i.ContactPhone).HasMaxLength(20);
    }
}

public class ScrapingJobConfiguration : IEntityTypeConfiguration<ScrapingJob>
{
    public void Configure(EntityTypeBuilder<ScrapingJob> builder)
    {
        builder.ToTable("ScrapingJobs");
        builder.HasKey(j => j.Id);

        builder.Property(j => j.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(j => j.ServiceBusMessageId).HasMaxLength(256);
        builder.Property(j => j.ErrorMessage).HasMaxLength(2000);

        builder.HasOne(j => j.QuotationRequest).WithMany(q => q.ScrapingJobs)
            .HasForeignKey(j => j.QuotationRequestId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(j => j.Insurer).WithMany(i => i.ScrapingJobs)
            .HasForeignKey(j => j.InsurerId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(j => j.Status);
        builder.HasIndex(j => j.QuotationRequestId);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityId).HasMaxLength(100);
        builder.Property(a => a.OldValues).HasColumnType("TEXT");
        builder.Property(a => a.NewValues).HasColumnType("TEXT");
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.UserAgent).HasMaxLength(500);
        builder.Property(a => a.Endpoint).HasMaxLength(500);
        builder.Property(a => a.AdditionalInfo).HasMaxLength(2000);

        builder.HasOne(a => a.User).WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.Action);
    }
}
