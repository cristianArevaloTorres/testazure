using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.Auth;
using MediatR;

namespace LocktonOrion.Application.Features.Identity.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<LoginResponseDto>>;
