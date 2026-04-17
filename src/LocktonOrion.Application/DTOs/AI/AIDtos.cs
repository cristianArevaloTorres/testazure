namespace LocktonOrion.Application.DTOs.AI;

public record ChatMessageRequestDto(
    Guid? ConversationId,
    string Message,
    Guid? RelatedQuotationId = null,
    Guid? RelatedClientId = null
);

public record ChatResponseDto(
    Guid ConversationId,
    string Response,
    string Model,
    int TokensUsed,
    DateTimeOffset Timestamp
);

public record ConversationMessageDto(
    Guid Id,
    string Role,
    string Content,
    DateTimeOffset Timestamp,
    int? TokensUsed,
    long? ResponseMs
);
