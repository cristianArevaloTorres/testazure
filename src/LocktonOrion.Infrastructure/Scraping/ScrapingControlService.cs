namespace LocktonOrion.Infrastructure.Scraping;

/// <summary>
/// Singleton que controla el estado del simulador de scraping (pausa/reanudación).
/// Se comparte entre el controller y el BackgroundService.
/// </summary>
public class ScrapingControlService
{
    private volatile bool _paused = false;

    public bool IsPaused => _paused;

    public void Pause()  => _paused = true;
    public void Resume() => _paused = false;
}
