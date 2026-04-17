using LocktonOrion.Application.Features.Identity.Commands;
using LocktonOrion.Application.DTOs.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Swashbuckle.AspNetCore.Annotations;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [SwaggerOperation(Summary = "Iniciar sesión", Description = "Autenticación con email y contraseña. Devuelve JWT.")]
    [ProducesResponseType(typeof(LoginResponseDto), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(dto.Email, dto.Password), ct);
        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, new { error = result.Error });

        // Set refresh token in HttpOnly cookie
        Response.Cookies.Append("refreshToken", result.Data!.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new { result.Data!.AccessToken, result.Data.ExpiresIn, result.Data.User });
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [SwaggerOperation(Summary = "Registrar usuario")]
    [ProducesResponseType(typeof(RegisterResponseDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegisterCommand(dto.FirstName, dto.LastName, dto.Email, dto.Password, dto.Phone), ct);

        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return StatusCode(201, result.Data);
    }

    [HttpPost("logout")]
    [Authorize]
    [SwaggerOperation(Summary = "Cerrar sesión")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    [HttpGet("profile")]
    [Authorize]
    [SwaggerOperation(Summary = "Perfil del usuario autenticado")]
    public IActionResult GetProfile()
    {
        var userId = User.FindFirst("sub")?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var role = User.FindFirst("role")?.Value;
        var name = $"{User.FindFirst(System.Security.Claims.ClaimTypes.GivenName)?.Value} {User.FindFirst(System.Security.Claims.ClaimTypes.Surname)?.Value}".Trim();

        return Ok(new { userId, email, role, name });
    }
}

public record LoginRequestDto(string Email, string Password);
public record RegisterRequestDto(string FirstName, string LastName, string Email, string Password, string? Phone);
