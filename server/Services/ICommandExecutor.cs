using System.Threading;
using System.Threading.Tasks;

namespace IssuerServer.Services;

public record CommandResult(int ExitCode, string Stdout, string Stderr, long ElapsedMs)
{
    public bool Success => ExitCode == 0;
}

public interface ICommandExecutor
{
    Task<CommandResult> ExecuteAsync(string command, string args, string workingDir, int timeoutMs, CancellationToken ct);
}
