using System.Net.Sockets;
using System.Text.RegularExpressions;
using System.Diagnostics;
using IssuerServer.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Serilog;

namespace IssuerServer.Services;

    public class PortMonitorService : BackgroundService
    {
    private readonly PortMonitorOptions _options;
    private readonly ICommandExecutor _executor;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    // controls whether the periodic automatic checks run
    private volatile bool _monitoringEnabled;

    public PortMonitorService(IOptions<PortMonitorOptions> options, ICommandExecutor executor)
    {
        _options = options.Value;
        _executor = executor;
        _monitoringEnabled = _options.Enabled;
    }

    // Provide a simple startup trigger that can be called from Program.cs
    public async Task TriggerOnStartupAsync(CancellationToken ct)
    {
        if (!_options.Enabled) return;
        try
        {
            await CheckOnceAsync(ct);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PortMonitorService: error during startup trigger");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            Log.Information("PortMonitorService: disabled by configuration");
            return;
        }

        Log.Information("PortMonitorService: started, monitoring {Host}:{Port} every {Minutes} minutes", _options.Host, _options.Port, _options.IntervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!_monitoringEnabled)
            {
                // Monitoring disabled - sleep briefly and continue without performing checks
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                continue;
            }

            try
            {
                await CheckOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "PortMonitorService: unexpected error during check");
            }

            await Task.Delay(TimeSpan.FromMinutes(_options.IntervalMinutes), stoppingToken);
        }
    }

    // Exposed method to allow manual trigger from API
    public async Task TriggerOnceAsync(CancellationToken ct)
    {
        await CheckOnceAsync(ct);
    }

    // Kill processes that are listening/connected to configured port
    public async Task<int[]> KillListenersAsync(CancellationToken ct)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = "-ano",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var proc = Process.Start(psi);
            if (proc == null) return Array.Empty<int>();

            var output = await proc.StandardOutput.ReadToEndAsync();
            proc.WaitForExit(5000);

            var pids = new HashSet<int>();
            var pattern = $"\\s*TCP\\s+\\S+:{_options.Port}\\s+\\S+\\s+\\S+\\s+(\\d+)";
            var rx = new Regex(pattern);
            foreach (Match m in rx.Matches(output))
            {
                if (int.TryParse(m.Groups[1].Value, out var pid)) pids.Add(pid);
            }

            var killed = new List<int>();
            foreach (var pid in pids)
            {
                try
                {
                    var p = Process.GetProcessById(pid);
                    Log.Information("PortMonitorService: attempting to kill process {Pid} ({Name})", pid, p.ProcessName);
                    p.Kill(true);
                    killed.Add(pid);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "PortMonitorService: failed to kill pid {Pid}", pid);
                }
            }

            return killed.ToArray();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PortMonitorService: exception when attempting to kill listeners");
            return Array.Empty<int>();
        }
    }

    public void DisableMonitoring()
    {
        _monitoringEnabled = false;
        Log.Information("PortMonitorService: monitoring disabled via API");
    }

    private async Task CheckOnceAsync(CancellationToken ct)
    {
        if (!await _semaphore.WaitAsync(0, ct))
        {
            Log.Warning("PortMonitorService: previous run still in progress, skipping this cycle");
            return;
        }

        try
        {
            var open = await IsPortOpenAsync(_options.Host, _options.Port, _options.TimeoutMs);
            if (open)
            {
                Log.Debug("PortMonitorService: port {Port} is open", _options.Port);
                return;
            }

            Log.Warning("PortMonitorService: port {Port} is not responding, attempting to execute command", _options.Port);

            var attempt = 0;
            while (attempt <= _options.MaxRetries)
            {
                attempt++;
                var result = await _executor.ExecuteAsync(_options.Command, _options.Args, _options.WorkingDirectory, _options.TimeoutMs, ct);
                // Log detailed result immediately so caller can see command outputs in logs
                Log.Information("PortMonitorService: command attempt {Attempt} finished with exit {Exit} after {Ms}ms", attempt, result.ExitCode, result.ElapsedMs);
                if (!string.IsNullOrEmpty(result.Stdout)) Log.Information("PortMonitorService: command stdout: {Out}", result.Stdout);
                if (!string.IsNullOrEmpty(result.Stderr)) Log.Warning("PortMonitorService: command stderr: {Err}", result.Stderr);
                if (result.Success)
                {
                    Log.Information("PortMonitorService: command succeeded (exit {Exit}) after {Ms}ms", result.ExitCode, result.ElapsedMs);
                    return;
                }

                Log.Error("PortMonitorService: command failed (exit {Exit}). Stderr: {Err}", result.ExitCode, result.Stderr);

                if (attempt > _options.MaxRetries) break;
                Log.Information("PortMonitorService: retrying in {Sec} seconds (attempt {Attempt}/{Max})", _options.RetryBackoffSeconds, attempt, _options.MaxRetries);
                await Task.Delay(TimeSpan.FromSeconds(_options.RetryBackoffSeconds), ct);
            }

            Log.Error("PortMonitorService: all attempts failed for command {Cmd}", _options.Command);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private async Task<bool> IsPortOpenAsync(string host, int port, int timeoutMs)
    {
        try
        {
            using var tcp = new TcpClient();
            var connectTask = tcp.ConnectAsync(host, port);
            var timeoutTask = Task.Delay(timeoutMs);
            var completed = await Task.WhenAny(connectTask, timeoutTask);
            if (completed == connectTask && tcp.Connected) return true;
            return false;
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "PortMonitorService: exception when checking port");
            return false;
        }
    }
}
