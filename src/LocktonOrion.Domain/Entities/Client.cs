using LocktonOrion.Domain.Common;

namespace LocktonOrion.Domain.Entities;

public class Client : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    // Datos sensibles – cifrados AES-256 en DB
    public string? RfcEncrypted { get; set; }
    public string? CurpEncrypted { get; set; }

    public DateOnly? BirthDate { get; set; }
    public string? Gender { get; set; }

    // Dirección
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "MX";

    // Relaciones
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public Guid? AdvisorId { get; set; }
    public User? Advisor { get; set; }

    public ICollection<QuotationRequest> QuotationRequests { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}";
}
