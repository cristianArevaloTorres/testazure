using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.AI;
using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Interfaces.Repositories;
using MediatR;

namespace LocktonOrion.Application.Features.AI.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────
public record ConversationSummaryDto(
    Guid ConversationId,
    string LastMessage,
    DateTimeOffset LastMessageAt,
    int MessageCount,
    Guid? RelatedQuotationId,
    Guid? RelatedClientId
);

// ── Get conversations list ────────────────────────────────────────────────────
public record GetConversationsQuery(Guid UserId) : IRequest<Result<IEnumerable<ConversationSummaryDto>>>;

public class GetConversationsQueryHandler : IRequestHandler<GetConversationsQuery, Result<IEnumerable<ConversationSummaryDto>>>
{
    private readonly IGenericRepository<ConversationMessage> _repo;

    public GetConversationsQueryHandler(IGenericRepository<ConversationMessage> repo)
    {
        _repo = repo;
    }

    public async Task<Result<IEnumerable<ConversationSummaryDto>>> Handle(GetConversationsQuery request, CancellationToken ct)
    {
        var all = (await _repo.FindAsync(m => m.UserId == request.UserId, ct)).ToList();

        var conversations = all
            .GroupBy(m => m.ConversationId)
            .Select(g =>
            {
                var last = g.OrderByDescending(m => m.Timestamp).First();
                return new ConversationSummaryDto(
                    g.Key,
                    last.Content.Length > 120 ? last.Content[..120] : last.Content,
                    g.Max(m => m.Timestamp),
                    g.Count(),
                    last.RelatedQuotationId,
                    last.RelatedClientId
                );
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

        return Result<IEnumerable<ConversationSummaryDto>>.Success(conversations);
    }
}

// ── Get conversation history ──────────────────────────────────────────────────
public record GetConversationHistoryQuery(Guid UserId, Guid ConversationId) : IRequest<Result<IEnumerable<ConversationMessageDto>>>;

public class GetConversationHistoryQueryHandler : IRequestHandler<GetConversationHistoryQuery, Result<IEnumerable<ConversationMessageDto>>>
{
    private readonly IGenericRepository<ConversationMessage> _repo;

    public GetConversationHistoryQueryHandler(IGenericRepository<ConversationMessage> repo)
    {
        _repo = repo;
    }

    public async Task<Result<IEnumerable<ConversationMessageDto>>> Handle(GetConversationHistoryQuery request, CancellationToken ct)
    {
        var messages = (await _repo.FindAsync(
            m => m.UserId == request.UserId && m.ConversationId == request.ConversationId, ct))
            .OrderBy(m => m.Timestamp)
            .Select(m => new ConversationMessageDto(m.Id, m.Role, m.Content, m.Timestamp, m.TokensUsed, m.ResponseMs))
            .ToList();

        return Result<IEnumerable<ConversationMessageDto>>.Success(messages);
    }
}

// ── Clear conversation ────────────────────────────────────────────────────────
public record ClearConversationCommand(Guid UserId, Guid ConversationId) : IRequest<Result<bool>>;

public class ClearConversationCommandHandler : IRequestHandler<ClearConversationCommand, Result<bool>>
{
    private readonly IGenericRepository<ConversationMessage> _repo;

    public ClearConversationCommandHandler(IGenericRepository<ConversationMessage> repo)
    {
        _repo = repo;
    }

    public async Task<Result<bool>> Handle(ClearConversationCommand request, CancellationToken ct)
    {
        var messages = (await _repo.FindAsync(
            m => m.UserId == request.UserId && m.ConversationId == request.ConversationId, ct)).ToList();

        if (messages.Count == 0)
            return Result<bool>.NotFound("Conversación no encontrada");

        _repo.RemoveRange(messages);
        await _repo.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
