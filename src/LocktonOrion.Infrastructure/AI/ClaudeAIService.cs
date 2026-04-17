using LocktonOrion.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LocktonOrion.Infrastructure.AI;

public class ClaudeAIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClaudeAIService> _logger;

    private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
    private const string DefaultModel = "claude-3-5-sonnet-20241022";
    private const string AnthropicVersion = "2023-06-01";

    public ClaudeAIService(HttpClient httpClient, IConfiguration configuration, ILogger<ClaudeAIService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AIResponse> SendMessageAsync(AIRequest request, CancellationToken ct = default)
    {
        var apiKey = _configuration["Anthropic:ApiKey"]
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        var model = request.Model ?? DefaultModel;
        var maxTokens = request.MaxTokens ?? 1024;

        var requestBody = new
        {
            model,
            max_tokens = maxTokens,
            system = request.SystemPrompt,
            messages = request.Messages.Select(m => new { role = m.Role, content = m.Content })
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", AnthropicVersion);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var response = await _httpClient.PostAsync(AnthropicApiUrl, content, ct);
        sw.Stop();

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Claude API error {StatusCode}: {Error}", response.StatusCode, error);
            throw new HttpRequestException($"Claude API returned {response.StatusCode}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        var claudeResponse = JsonSerializer.Deserialize<ClaudeResponse>(responseJson)
            ?? throw new InvalidOperationException("Failed to deserialize Claude response");

        var responseText = claudeResponse.Content?.FirstOrDefault()?.Text ?? string.Empty;

        return new AIResponse(
            Content: responseText,
            Model: claudeResponse.Model ?? model,
            InputTokens: claudeResponse.Usage?.InputTokens ?? 0,
            OutputTokens: claudeResponse.Usage?.OutputTokens ?? 0,
            ElapsedMs: sw.ElapsedMilliseconds
        );
    }

    private record ClaudeResponse(
        [property: JsonPropertyName("content")] List<ClaudeContent>? Content,
        [property: JsonPropertyName("model")] string? Model,
        [property: JsonPropertyName("usage")] ClaudeUsage? Usage
    );

    private record ClaudeContent(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string? Text
    );

    private record ClaudeUsage(
        [property: JsonPropertyName("input_tokens")] int InputTokens,
        [property: JsonPropertyName("output_tokens")] int OutputTokens
    );
}
