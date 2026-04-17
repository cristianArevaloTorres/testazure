namespace LocktonOrion.Application.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Error { get; private set; }
    public IEnumerable<string> Errors { get; private set; } = [];
    public int StatusCode { get; private set; }

    private Result() { }

    public static Result<T> Success(T data, int statusCode = 200) =>
        new() { IsSuccess = true, Data = data, StatusCode = statusCode };

    public static Result<T> Failure(string error, int statusCode = 400) =>
        new() { IsSuccess = false, Error = error, StatusCode = statusCode, Errors = [error] };

    public static Result<T> Failure(IEnumerable<string> errors, int statusCode = 400) =>
        new() { IsSuccess = false, Errors = errors, Error = string.Join("; ", errors), StatusCode = statusCode };

    public static Result<T> NotFound(string message = "Recurso no encontrado") =>
        new() { IsSuccess = false, Error = message, StatusCode = 404, Errors = [message] };

    public static Result<T> Unauthorized(string message = "No autorizado") =>
        new() { IsSuccess = false, Error = message, StatusCode = 401, Errors = [message] };

    public static Result<T> Forbidden(string message = "Acceso denegado") =>
        new() { IsSuccess = false, Error = message, StatusCode = 403, Errors = [message] };
}
