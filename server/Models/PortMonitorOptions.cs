namespace IssuerServer.Models;

public class PortMonitorOptions
{
    public bool Enabled { get; set; } = true;
    public int IntervalMinutes { get; set; } = 15;
    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 6060;
    public int TimeoutMs { get; set; } = 2000;
    public string Command { get; set; } = string.Empty;
    public string Args { get; set; } = string.Empty;
    public string WorkingDirectory { get; set; } = string.Empty;
    public int MaxRetries { get; set; } = 1;
    public int RetryBackoffSeconds { get; set; } = 30;
}
