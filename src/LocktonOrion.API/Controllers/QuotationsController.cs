using LocktonOrion.Application.Features.Quotation.Commands;
using LocktonOrion.Application.Features.Quotation.Queries;
using LocktonOrion.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/quotations")]
[Authorize]
[Produces("application/json")]
public class QuotationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public QuotationsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [SwaggerOperation(Summary = "Listar cotizaciones con filtros y paginación")]
    public async Task<IActionResult> GetQuotations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] QuotationStatus? status = null,
        [FromQuery] Guid? clientId = null,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var query = new GetQuotationsQuery(page, pageSize, search, status, clientId,
            AdvisorId: null, RequestingUserId: userId, UserRole: role);

        var result = await _mediator.Send(query, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, result.Error);
    }

    [HttpPost]
    [Authorize(Roles = "Client,Advisor,Admin")]
    [SwaggerOperation(Summary = "Crear solicitud de cotización")]
    [ProducesResponseType(201)]
    public async Task<IActionResult> CreateQuotation([FromBody] CreateQuotationRequest dto, CancellationToken ct)
    {
        var userId = GetUserId();

        var command = new CreateQuotationCommand(
            dto.ClientId,
            userId,
            dto.InsuranceType,
            dto.ProductId,
            dto.RequestData,
            dto.Notes);

        var result = await _mediator.Send(command, ct);

        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return StatusCode(201, result.Data);
    }

    [HttpGet("{id:guid}")]
    [SwaggerOperation(Summary = "Detalle de cotización")]
    public async Task<IActionResult> GetQuotation(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetQuotationByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpGet("{id:guid}/comparison")]
    [SwaggerOperation(Summary = "Comparativa de resultados de cotización")]
    public async Task<IActionResult> GetComparison(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetQuotationComparisonQuery(id), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Advisor,Admin")]
    [SwaggerOperation(Summary = "Actualizar estatus de cotización")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new UpdateQuotationStatusCommand(id, dto.Status, dto.Reason, userId), ct);
        return result.IsSuccess ? Ok(new { id, status = dto.Status }) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpPost("{id:guid}/notes")]
    [Authorize(Roles = "Advisor,Admin")]
    [SwaggerOperation(Summary = "Agregar nota a cotización")]
    public async Task<IActionResult> AddNote(Guid id, [FromBody] AddNoteRequest dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new AddAdvisorNoteCommand(id, dto.Note, userId), ct);
        return result.IsSuccess ? NoContent() : StatusCode(result.StatusCode, new { error = result.Error });
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());

    private string GetUserRole() =>
        User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value ?? "Client";
}

public record CreateQuotationRequest(
    Guid ClientId,
    InsuranceType InsuranceType,
    Guid? ProductId,
    object RequestData,
    string? Notes);

public record UpdateStatusRequest(string Status, string? Reason);
public record AddNoteRequest(string Note);
