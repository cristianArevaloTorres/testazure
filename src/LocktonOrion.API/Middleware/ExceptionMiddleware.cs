using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace LocktonOrion.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await HandleValidationException(context, ex);
        }
        catch (UnauthorizedAccessException ex)
        {
            await HandleException(context, ex, StatusCodes.Status401Unauthorized, "No autorizado");
        }
        catch (KeyNotFoundException ex)
        {
            await HandleException(context, ex, StatusCodes.Status404NotFound, "Recurso no encontrado");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Invalid operation: {Message}", ex.Message);
            await HandleException(context, ex, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleException(context, ex, StatusCodes.Status500InternalServerError,
                "Ha ocurrido un error interno. Por favor contacte soporte.");
        }
    }

    private static async Task HandleValidationException(HttpContext context, ValidationException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json";

        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

        var response = new
        {
            type = "ValidationError",
            title = "Datos de entrada inválidos",
            status = 400,
            traceId = context.TraceIdentifier,
            errors
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    private static async Task HandleException(HttpContext context, Exception ex, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            type = statusCode switch
            {
                401 => "Unauthorized",
                403 => "Forbidden",
                404 => "NotFound",
                _ => "Error"
            },
            title = message,
            status = statusCode,
            traceId = context.TraceIdentifier
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
