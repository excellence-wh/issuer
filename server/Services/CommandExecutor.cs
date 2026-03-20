using System.Diagnostics;
using System.Text;
using Serilog;

namespace IssuerServer.Services;

public class CommandExecutor : ICommandExecutor
{
    public async Task<CommandResult> ExecuteAsync(string command, string args, string workingDir, int timeoutMs, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        var psi = new ProcessStartInfo
        {
            FileName = command,
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = string.IsNullOrEmpty(workingDir) ? Environment.CurrentDirectory : workingDir,
        };

        try
        {
            using var proc = new Process { StartInfo = psi };
            var stdoutSb = new StringBuilder();
            var stderrSb = new StringBuilder();

            proc.OutputDataReceived += (s, e) => { if (e.Data != null) stdoutSb.AppendLine(e.Data); };
            proc.ErrorDataReceived += (s, e) => { if (e.Data != null) stderrSb.AppendLine(e.Data); };

            if (!proc.Start())
            {
                Log.Error("CommandExecutor: failed to start process {Command} {Args}", command, args);
                return new CommandResult(-1, string.Empty, "failed to start", sw.ElapsedMilliseconds);
            }

            proc.BeginOutputReadLine();
            proc.BeginErrorReadLine();

            var tcs = new TaskCompletionSource<int>();
            proc.Exited += (s, e) => tcs.TrySetResult(proc.ExitCode);
            proc.EnableRaisingEvents = true;

            using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct);
            var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(timeoutMs, linked.Token));
            if (completedTask != tcs.Task)
            {
                try
                {
                    proc.Kill(true);
                }
                catch { }
                Log.Warning("CommandExecutor: process timeout {Command} {Args}", command, args);
                return new CommandResult(-2, stdoutSb.ToString(), stderrSb.ToString() + "\n(timeout)", sw.ElapsedMilliseconds);
            }

            var exit = await tcs.Task;
            sw.Stop();
            return new CommandResult(exit, stdoutSb.ToString(), stderrSb.ToString(), sw.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            sw.Stop();
            Log.Error(ex, "CommandExecutor: exception when running {Command} {Args}", command, args);
            return new CommandResult(-99, string.Empty, ex.Message, sw.ElapsedMilliseconds);
        }
    }
}
