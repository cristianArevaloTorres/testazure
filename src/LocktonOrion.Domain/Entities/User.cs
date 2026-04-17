using LocktonOrion.Domain.Common;
using LocktonOrion.Domain.Enums;

namespace LocktonOrion.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.Client;
    public string? RefreshToken { get; set; }
    public DateTimeOffset? RefreshTokenExpiry { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public string? PasswordResetToken { get; set; }
    public DateTimeOffset? PasswordResetTokenExpiry { get; set; }

    public string FullName => $"{FirstName} {LastName}";

    // Navigation
    public Client? Client { get; set; }
    public ICollection<QuotationRequest> QuotationRequests { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
    public ICollection<ConversationMessage> ConversationMessages { get; set; } = [];
}
