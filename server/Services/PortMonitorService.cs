using System.Net.Sockets;
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

    public PortMonitorService(IOptions<PortMonitorOptions> options, ICommandExecutor executor)
    {
        _options = options.Value;
        _executor = executor;
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
                if (result.Success)
                {
                    Log.Information("PortMonitorService: command succeeded (exit {Exit}) after {Ms}ms", result.ExitCode, result.ElapsedMs);
                    Log.Debug("Stdout: {Out}", result.Stdout);
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
