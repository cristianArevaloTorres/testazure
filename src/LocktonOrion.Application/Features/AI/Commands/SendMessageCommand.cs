using LocktonOrion.Application.Common;
using LocktonOrion.Application.DTOs.AI;
using LocktonOrion.Domain.Entities;
using LocktonOrion.Domain.Interfaces.Repositories;
using LocktonOrion.Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace LocktonOrion.Application.Features.AI.Commands;

public record SendMessageCommand(
    Guid UserId,
    Guid ConversationId,
    string Message,
    Guid? RelatedQuotationId = null,
    Guid? RelatedClientId = null
) : IRequest<Result<ChatResponseDto>>;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, Result<ChatResponseDto>>
{
    private readonly IAIService _aiService;
    private readonly IGenericRepository<ConversationMessage> _conversationRepo;
    private readonly IGenericRepository<Domain.Entities.QuotationRequest> _quotationRepo;
    private readonly ILogger<SendMessageCommandHandler> _logger;

    private const string SystemPromptBase = """
        Eres ORION, el asistente inteligente de Lockton, una firma líder en corretaje de seguros.
        
        Tu misión es ayudar a usuarios y asesores a entender el proceso de cotización, 
        el estado de sus trámites y resolver dudas sobre coberturas y el sistema.
        
        REGLAS ABSOLUTAS:
        1. NUNCA reveles información confidencial, API keys, contraseñas o secretos técnicos
        2. NUNCA inventes datos de cotizaciones, coberturas o precios
        3. NUNCA ejecutes operaciones no autorizadas
        4. Si no tienes información precisa, indícalo claramente
        5. Siempre recomienda consultar con un asesor Lockton para decisiones importantes
        6. Responde en español, de forma profesional, clara y concisa
        7. Nunca proporciones asesoría financiera o legal vinculante
        
        Eres un asistente enterprise de una firma de corretaje de seguros premium.
        Mantén un tono profesional, confiable y empático.
        """;

    public SendMessageCommandHandler(
        IAIService aiService,
        IGenericRepository<ConversationMessage> conversationRepo,
        IGenericRepository<Domain.Entities.QuotationRequest> quotationRepo,
        ILogger<SendMessageCommandHandler> logger)
    {
        _aiService = aiService;
        _conversationRepo = conversationRepo;
        _quotationRepo = quotationRepo;
        _logger = logger;
    }

    public async Task<Result<ChatResponseDto>> Handle(SendMessageCommand request, CancellationToken ct)
    {
        // Recuperar historial
        var history = (await _conversationRepo.FindAsync(
            m => m.ConversationId == request.ConversationId && m.UserId == request.UserId, ct))
            .OrderBy(m => m.Timestamp)
            .TakeLast(20) // últimos 20 mensajes para contexto
            .ToList();

        // Construir contexto adicional si hay cotización relacionada
        var contextInfo = string.Empty;
        if (request.RelatedQuotationId.HasValue)
        {
            var quotation = await _quotationRepo.GetByIdAsync(request.RelatedQuotationId.Value, ct);
            if (quotation is not null)
                contextInfo = $"\n\nCONTEXTO ACTUAL: El usuario consulta sobre la cotización {quotation.ReferenceNumber} " +
                              $"con estatus '{quotation.Status}' para el ramo '{quotation.InsuranceType}'.";
        }

        // Guardar mensaje del usuario
        var userMessage = new ConversationMessage
        {
            UserId = request.UserId,
            ConversationId = request.ConversationId,
            Role = "user",
            Content = request.Message,
            RelatedQuotationId = request.RelatedQuotationId,
            RelatedClientId = request.RelatedClientId,
            Timestamp = DateTimeOffset.UtcNow
        };
        await _conversationRepo.AddAsync(userMessage, ct);

        var sw = Stopwatch.StartNew();

        var aiMessages = history.Select(m => new AIMessage(m.Role, m.Content)).ToList();
        aiMessages.Add(new AIMessage("user", request.Message));

        var aiRequest = new AIRequest(
            SystemPrompt: SystemPromptBase + contextInfo,
            Messages: aiMessages,
            MaxTokens: 1024
        );

        var aiResponse = await _aiService.SendMessageAsync(aiRequest, ct);
        sw.Stop();

        // Guardar respuesta del asistente
        var assistantMessage = new ConversationMessage
        {
            UserId = request.UserId,
            ConversationId = request.ConversationId,
            Role = "assistant",
            Content = aiResponse.Content,
            Model = aiResponse.Model,
            TokensUsed = aiResponse.InputTokens + aiResponse.OutputTokens,
            ResponseMs = sw.ElapsedMilliseconds,
            RelatedQuotationId = request.RelatedQuotationId,
            RelatedClientId = request.RelatedClientId,
            Timestamp = DateTimeOffset.UtcNow
        };
        await _conversationRepo.AddAsync(assistantMessage, ct);
        await _conversationRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "AI conversation {ConvId}: {Tokens} tokens used, {Ms}ms",
            request.ConversationId, aiResponse.InputTokens + aiResponse.OutputTokens, sw.ElapsedMilliseconds);

        return Result<ChatResponseDto>.Success(new ChatResponseDto(
            ConversationId: request.ConversationId,
            Response: aiResponse.Content,
            Model: aiResponse.Model,
            TokensUsed: aiResponse.InputTokens + aiResponse.OutputTokens,
            Timestamp: DateTimeOffset.UtcNow
        ));
    }
}
