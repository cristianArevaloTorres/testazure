using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using LocktonOrion.Application.Features.Quotation.Queries;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ClientsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(Roles = "Advisor,Supervisor,Admin")]
    public async Task<IActionResult> GetClients(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        // This would use a GetClientsQuery in a full implementation
        // Stubbed with empty result for now
        return Ok(new { items = Array.Empty<object>(), totalCount = 0, page, pageSize, totalPages = 0 });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Advisor,Supervisor,Admin")]
    public async Task<IActionResult> GetClient(Guid id, CancellationToken ct = default)
    {
        return Ok(new { id, message = "Client detail endpoint – implement GetClientQuery" });
    }

    [HttpPost]
    [Authorize(Roles = "Advisor,Admin")]
    public async Task<IActionResult> CreateClient([FromBody] object request, CancellationToken ct = default)
    {
        return Accepted(new { message = "CreateClientCommand – to be implemented" });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Advisor,Admin")]
    public async Task<IActionResult> UpdateClient(Guid id, [FromBody] object request, CancellationToken ct = default)
    {
        return Accepted(new { id, message = "UpdateClientCommand – to be implemented" });
    }
}
