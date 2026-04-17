using LocktonOrion.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace LocktonOrion.Infrastructure.Messaging;

/// <summary>
/// No-op publisher used when Azure Service Bus is not configured.
/// </summary>
public class NullServiceBusPublisher : IServiceBusPublisher
{
    private readonly ILogger<NullServiceBusPublisher> _logger;

    public NullServiceBusPublisher(ILogger<NullServiceBusPublisher> logger)
    {
        _logger = logger;
    }

    public Task PublishAsync<T>(
        string topicOrQueue,
        T message,
        IDictionary<string, object>? properties = null,
        CancellationToken ct = default)
    {
        _logger.LogDebug("Service Bus not configured – message to {TopicOrQueue} dropped.", topicOrQueue);
        return Task.CompletedTask;
    }
}
