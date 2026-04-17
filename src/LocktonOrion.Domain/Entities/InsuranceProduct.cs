using LocktonOrion.Domain.Common;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Entities;

public class InsuranceProduct : AuditableEntity
{
    public Guid InsurerId { get; set; }
    public Insurer Insurer { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public InsuranceType InsuranceType { get; set; }
    public string? DetailsJson { get; set; }
    public int SortOrder { get; set; } = 0;

    public ICollection<QuotationRequest> QuotationRequests { get; set; } = [];
}
