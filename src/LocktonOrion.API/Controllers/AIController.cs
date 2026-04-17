using LocktonOrion.Application.DTOs.AI;
using LocktonOrion.Application.Features.AI.Commands;
using LocktonOrion.Application.Features.AI.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Security.Claims;

namespace LocktonOrion.API.Controllers;

[ApiController]
[Route("api/v1/ai")]
[Authorize]
[Produces("application/json")]
public class AIController : ControllerBase
{
    private readonly IMediator _mediator;

    public AIController(IMediator mediator) => _mediator = mediator;

    [HttpPost("chat")]
    [SwaggerOperation(Summary = "Enviar mensaje al chatbot ORION")]
    [ProducesResponseType(typeof(ChatResponseDto), 200)]
    public async Task<IActionResult> Chat([FromBody] ChatMessageRequestDto dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var conversationId = dto.ConversationId ?? Guid.NewGuid();

        var command = new SendMessageCommand(
            UserId: userId,
            ConversationId: conversationId,
            Message: dto.Message,
            RelatedQuotationId: dto.RelatedQuotationId,
            RelatedClientId: dto.RelatedClientId
        );

        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpGet("conversations")]
    [SwaggerOperation(Summary = "Listar conversaciones del usuario")]
    public async Task<IActionResult> GetConversations(CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new GetConversationsQuery(userId), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpGet("conversations/{conversationId:guid}")]
    [SwaggerOperation(Summary = "Obtener mensajes de una conversación")]
    public async Task<IActionResult> GetConversation(Guid conversationId, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new GetConversationHistoryQuery(userId, conversationId), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { error = result.Error });
    }

    [HttpDelete("conversations/{conversationId:guid}")]
    [SwaggerOperation(Summary = "Limpiar historial de conversación")]
    public async Task<IActionResult> ClearConversation(Guid conversationId, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new ClearConversationCommand(userId, conversationId), ct);
        return result.IsSuccess ? NoContent() : StatusCode(result.StatusCode, new { error = result.Error });
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}
