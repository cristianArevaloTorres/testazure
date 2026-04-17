using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Auth;
using LocktonOrion.Domain.Interfaces.Repositories;
using LocktonOrion.Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Application.Features.Identity.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    private readonly IGenericRepository<Domain.Entities.User> _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IGenericRepository<Domain.Entities.User> userRepo,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<Result<LoginResponseDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _userRepo.FirstOrDefaultAsync(
            u => u.Email == request.Email.ToLowerInvariant() && u.IsActive && !u.IsDeleted, ct);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
            return Result<LoginResponseDto>.Unauthorized("Credenciales inválidas");
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(7);
        user.LastLoginAt = DateTimeOffset.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync(ct);

        _logger.LogInformation("User {UserId} logged in successfully", user.Id);

        return Result<LoginResponseDto>.Success(new LoginResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresIn: 900,
            User: new UserSummaryDto(user.Id, user.FullName, user.Email, user.Role.ToString())
        ));
    }
}
