namespace LocktonOrion.Domain.Interfaces.Services;

public interface IAIService
{
    Task<AIResponse> SendMessageAsync(AIRequest request, CancellationToken ct = default);
}

public record AIRequest(
    string SystemPrompt,
    IList<AIMessage> Messages,
    string? Model = null,
    int? MaxTokens = null
);

public record AIMessage(string Role, string Content);

public record AIResponse(
    string Content,
    string Model,
    int InputTokens,
    int OutputTokens,
    long ElapsedMs
);
