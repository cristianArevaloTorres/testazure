using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    [HttpGet]
    public IActionResult GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null)
    {
        return Ok(new { items = Array.Empty<object>(), totalCount = 0, page, pageSize, totalPages = 0 });
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetUser(Guid id) =>
        Ok(new { id, message = "GetUserQuery – to be implemented" });

    [HttpPost]
    public IActionResult CreateUser([FromBody] object request) =>
        Accepted(new { message = "CreateUserCommand – to be implemented" });

    [HttpPut("{id:guid}/role")]
    public IActionResult UpdateRole(Guid id, [FromBody] object request) =>
        Accepted(new { id, message = "UpdateUserRoleCommand – to be implemented" });

    [HttpPut("{id:guid}/status")]
    public IActionResult SetStatus(Guid id, [FromBody] object request) =>
        Accepted(new { id, message = "SetUserStatusCommand – to be implemented" });
}
