namespace IssuerServer.Models;

public class PortMonitorOptions
{
    public bool Enabled { get; set; } = true;
    public int IntervalMinutes { get; set; } = 15;
    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 6060;
    // Default execute timeout increased to 5 minutes to allow npm install / startup tasks
    public int TimeoutMs { get; set; } = 300000;
    public string Command { get; set; } = string.Empty;
    public string Args { get; set; } = string.Empty;
    public string WorkingDirectory { get; set; } = string.Empty;
    public int MaxRetries { get; set; } = 1;
    public int RetryBackoffSeconds { get; set; } = 30;
}
