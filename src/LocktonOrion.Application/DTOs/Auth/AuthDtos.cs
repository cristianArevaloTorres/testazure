namespace LocktonOrion.Application.DTOs.Auth;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserSummaryDto User
);

public record UserSummaryDto(
    Guid Id,
    string Name,
    string Email,
    string Role
);

public record RegisterResponseDto(
    Guid Id,
    string Message
);

public record RefreshTokenRequestDto(string RefreshToken);
