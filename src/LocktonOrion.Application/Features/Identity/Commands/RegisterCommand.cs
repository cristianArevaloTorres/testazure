using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Auth;
using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Enums;
using LocktonOrion.Domain.Interfaces.Repositories;
using LocktonOrion.Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Application.Features.Identity.Commands;

public record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone,
    string Role = "Client") : IRequest<Result<RegisterResponseDto>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponseDto>>
{
    private readonly IGenericRepository<User> _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        IGenericRepository<User> userRepo,
        IPasswordHasher passwordHasher,
        ILogger<RegisterCommandHandler> logger)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<Result<RegisterResponseDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var email = request.Email.ToLowerInvariant();
        var exists = await _userRepo.ExistsAsync(u => u.Email == email, ct);
        if (exists)
            return Result<RegisterResponseDto>.Failure("Ya existe un usuario con ese correo", 409);

        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
            role = UserRole.Client;

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Phone = request.Phone,
            Role = role,
            CreatedBy = "system"
        };

        await _userRepo.AddAsync(user, ct);
        await _userRepo.SaveChangesAsync(ct);

        _logger.LogInformation("New user registered: {UserId} with role {Role}", user.Id, role);

        return Result<RegisterResponseDto>.Success(
            new RegisterResponseDto(user.Id, "Usuario registrado exitosamente"), 201);
    }
}
