using Azure.Messaging.ServiceBus;
using LocktonOrion.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace LocktonOrion.Infrastructure.Messaging;

public class ServiceBusPublisher : IServiceBusPublisher, IAsyncDisposable
{
    private readonly ServiceBusClient _client;
    private readonly ILogger<ServiceBusPublisher> _logger;

    public ServiceBusPublisher(IConfiguration configuration, ILogger<ServiceBusPublisher> logger)
    {
        var connectionString = configuration["AzureServiceBus:ConnectionString"]
            ?? throw new InvalidOperationException("Service Bus connection string not configured");

        _client = new ServiceBusClient(connectionString);
        _logger = logger;
    }

    public async Task PublishAsync<T>(
        string topicOrQueue,
        T message,
        IDictionary<string, object>? properties = null,
        CancellationToken ct = default)
    {
        await using var sender = _client.CreateSender(topicOrQueue);

        var payload = JsonSerializer.Serialize(message);
        var serviceBusMessage = new ServiceBusMessage(payload)
        {
            MessageId = Guid.NewGuid().ToString(),
            ContentType = "application/json",
            CorrelationId = Guid.NewGuid().ToString()
        };

        if (properties is not null)
        {
            foreach (var (key, value) in properties)
                serviceBusMessage.ApplicationProperties[key] = value;
        }

        await sender.SendMessageAsync(serviceBusMessage, ct);

        _logger.LogInformation(
            "Message published to {TopicOrQueue}. MessageId: {MessageId}",
            topicOrQueue, serviceBusMessage.MessageId);
    }

    public async ValueTask DisposeAsync()
    {
        await _client.DisposeAsync();
    }
}
