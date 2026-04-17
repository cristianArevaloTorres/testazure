namespace LocktonOrion.Domain.Interfaces.Services;

public interface IServiceBusPublisher
{
    Task PublishAsync<T>(string topicOrQueue, T message, IDictionary<string, object>? properties = null, CancellationToken ct = default);
}
