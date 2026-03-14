using System.Diagnostics;
using System.Text.RegularExpressions;
using IssuerServer.Models;
using Serilog;

namespace IssuerServer.Services;

/// <summary>
/// Hg 版本控制服务
/// </summary>
public class HgService
{
    private async Task<string> RunHgCommand(string args, string repoPath)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "hg",
            Arguments = $"--cwd \"{repoPath}\" {args}",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(startInfo);
        if (process == null) throw new Exception("Failed to start hg process");

        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return string.IsNullOrWhiteSpace(stdout) ? stderr : stdout;
    }

    private async Task<bool> VerifyIssueInChangeset(string revision, string issueNumber, string repoPath)
    {
        try
        {
            var descOutput = await RunHgCommand($"log -r {revision} --template \"{{desc}}\"", repoPath);
            var desc = descOutput.Trim();
            var exactPattern = new Regex($@"(?:#|issue\s*\(?\s*)?\b{Regex.Escape(issueNumber)}\b(?!\d)", RegexOptions.IgnoreCase);
            return exactPattern.IsMatch(desc);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "验证 Issue {IssueNumber} 在 changeset {Revision} 中失败", issueNumber, revision);
            return false;
        }
    }

    private async Task<List<string>> FindAllChangesetsByIssue(string issueNumber, string repoPath)
    {
        try
        {
            var output = await RunHgCommand($"log --keyword {issueNumber} --template \"{{rev}}:{{node|short}} {{desc|firstline}}\\n\"", repoPath);
            var lines = output.Trim().Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var revisions = new List<string>();

            foreach (var line in lines)
            {
                var match = Regex.Match(line, @"(\d+):([a-f0-9]+)");
                if (match.Success)
                {
                    var revision = match.Groups[1].Value;
                    if (await VerifyIssueInChangeset(revision, issueNumber, repoPath))
                    {
                        revisions.Add(revision);
                    }
                }
            }
            
            Log.Debug("Issue {IssueNumber} 找到 {Count} 个 changeset", issueNumber, revisions.Count);
            return revisions;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "查找 Issue {IssueNumber} 的所有 changeset 失败", issueNumber);
            return [];
        }
    }

    private async Task<string?> FindChangesetByIssue(string issueNumber, string repoPath)
    {
        try
        {
            var output = await RunHgCommand($"log --keyword {issueNumber} --template \"{{rev}}:{{node|short}} {{desc|firstline}}\\n\"", repoPath);
            var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                var match = Regex.Match(line, @"(\d+):([a-f0-9]+)");
                if (match.Success)
                {
                    var revision = match.Groups[1].Value;
                    if (await VerifyIssueInChangeset(revision, issueNumber, repoPath))
                    {
                        Log.Debug("Issue {IssueNumber} 找到 changeset {Revision}", issueNumber, revision);
                        return revision;
                    }
                }
            }
            return null;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "查找 Issue {IssueNumber} 的 changeset 失败", issueNumber);
            return null;
        }
    }

    /// <summary>
    /// 获取指定 issue 对应的 changeset 信息
    /// </summary>
    /// <param name="issueNumber">Issue 编号</param>
    /// <param name="repoPath">Hg 仓库路径</param>
    /// <returns>Changeset 信息</returns>
    public async Task<IssueInfo?> GetChangesetByIssue(string issueNumber, string repoPath)
    {
        try
        {
            Log.Information("获取 Issue {IssueNumber} 的 changeset, 仓库路径: {RepoPath}", issueNumber, repoPath);
            
            var revision = await FindChangesetByIssue(issueNumber, repoPath);
            if (revision == null)
            {
                Log.Warning("未找到 Issue {IssueNumber} 的 changeset", issueNumber);
                return null;
            }

            var revOutput = await RunHgCommand($"log -r {revision} --template \"{{rev}}\"", repoPath);
            var nodeOutput = await RunHgCommand($"log -r {revision} --template \"{{node|short}}\"", repoPath);
            var authorOutput = await RunHgCommand($"log -r {revision} --template \"{{author|person}}\"", repoPath);
            var dateOutput = await RunHgCommand($"log -r {revision} --template \"{{date|isodate}}\"", repoPath);
            var summaryOutput = await RunHgCommand($"log -r {revision} --template \"{{desc|firstline}}\"", repoPath);
            var statOutput = await RunHgCommand($"log -r {revision} --stat", repoPath);

            var files = new List<FileChangeInfo>();
            var lines = statOutput.Split('\n');
            foreach (var line in lines)
            {
                var match = Regex.Match(line, @"^(\s*)([^|]+)\s*\|\s*[\d\s+]+\s*$");
                if (match.Success && match.Groups[2].Success && !line.Contains("files changed"))
                {
                    var status = line.Contains('+') ? 'A' : line.Contains('-') ? 'D' : 'M';
                    files.Add(new FileChangeInfo { Path = match.Groups[2].Value.Trim(), Status = status.ToString(), Revision = revision });
                }
            }

            Log.Information("成功获取 Issue {IssueNumber} 的 changeset, 包含 {FileCount} 个文件", issueNumber, files.Count);
            return new IssueInfo
            {
                Revision = revOutput.Trim(),
                Node = nodeOutput.Trim(),
                Author = authorOutput.Trim(),
                Date = dateOutput.Trim(),
                Summary = summaryOutput.Trim(),
                Files = files
            };
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取 Issue {IssueNumber} 的 changeset 失败", issueNumber);
            return null;
        }
    }

    /// <summary>
    /// 获取指定 issue 变更的文件列表
    /// </summary>
    public async Task<List<FileChangeInfo>> GetFilesByIssue(string issueNumber, string repoPath)
    {
        try
        {
            Log.Debug("获取 Issue {IssueNumber} 的文件列表, 仓库路径: {RepoPath}", issueNumber, repoPath);
            
            var revision = await FindChangesetByIssue(issueNumber, repoPath);
            if (revision == null)
            {
                Log.Warning("未找到 Issue {IssueNumber} 的 changeset，无法获取文件", issueNumber);
                return [];
            }

            var statOutput = await RunHgCommand($"status --change {revision}", repoPath);
            var lines = statOutput.Trim().Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var files = lines.Select(line => new FileChangeInfo
            {
                Status = line.Substring(0, 1),
                Path = line.Length > 2 ? line.Substring(2).Trim() : string.Empty,
                Revision = revision
            }).ToList();

            Log.Debug("Issue {IssueNumber} 找到 {FileCount} 个变更文件", issueNumber, files.Count);
            return files;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取 Issue {IssueNumber} 的文件列表失败", issueNumber);
            return [];
        }
    }

    /// <summary>
    /// 获取指定 issue 的 diff 内容
    /// </summary>
    public async Task<string> GetFilesDiffByIssue(string issueNumber, string repoPath)
    {
        try
        {
            Log.Debug("获取 Issue {IssueNumber} 的 diff", issueNumber);
            
            var revision = await FindChangesetByIssue(issueNumber, repoPath);
            if (revision == null)
            {
                Log.Warning("未找到 Issue {IssueNumber} 的 changeset，无法获取 diff", issueNumber);
                return string.Empty;
            }
            
            var diff = await RunHgCommand($"diff -c {revision}", repoPath);
            Log.Debug("Issue {IssueNumber} diff 长度: {Length}", issueNumber, diff.Length);
            return diff;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取 Issue {IssueNumber} 的 diff 失败", issueNumber);
            return string.Empty;
        }
    }

    /// <summary>
    /// 获取指定 issue 的所有历史变更文件
    /// </summary>
    public async Task<List<FileChangeInfo>> GetAllFilesByIssue(string issueNumber, string repoPath)
    {
        try
        {
            Log.Information("获取 Issue {IssueNumber} 的所有历史文件, 仓库路径: {RepoPath}", issueNumber, repoPath);
            
            var revisions = await FindAllChangesetsByIssue(issueNumber, repoPath);
            if (revisions.Count == 0)
            {
                Log.Warning("未找到 Issue {IssueNumber} 的任何 changeset", issueNumber);
                return [];
            }

            var allFiles = new List<FileChangeInfo>();

            foreach (var revision in revisions)
            {
                var statOutput = await RunHgCommand($"status --change {revision}", repoPath);
                var lines = statOutput.Trim().Split('\n', StringSplitOptions.RemoveEmptyEntries);
                var files = lines.Select(line => new FileChangeInfo
                {
                    Status = line.Substring(0, 1),
                    Path = line.Length > 2 ? line.Substring(2).Trim() : string.Empty,
                    Revision = revision
                }).ToList();
                allFiles.AddRange(files);
            }

            var fileMap = new Dictionary<string, FileChangeInfo>();
            foreach (var file in allFiles)
            {
                var existing = fileMap.GetValueOrDefault(file.Path);
                if (existing == null || int.TryParse(file.Revision, out var newRev) && int.TryParse(existing.Revision, out var oldRev) && newRev > oldRev)
                {
                    fileMap[file.Path] = file;
                }
            }

            var result = fileMap.Values.ToList();
            Log.Information("Issue {IssueNumber} 共找到 {FileCount} 个唯一变更文件", issueNumber, result.Count);
            return result;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取 Issue {IssueNumber} 的所有历史文件失败", issueNumber);
            return [];
        }
    }

    /// <summary>
    /// 获取仓库中所有包含 issue 编号的提交
    /// </summary>
    public async Task<List<string>> GetAllIssueNumbers(string repoPath)
    {
        try
        {
            Log.Information("扫描仓库获取所有 Issue 编号, 仓库路径: {RepoPath}", repoPath);
            
            var logOutput = await RunHgCommand("log --template \"{desc}\"", repoPath);
            var issuePattern = new Regex(@"(?:issue\s*\(?\s*(\d+)\s*\)?|#(\d+))", RegexOptions.IgnoreCase);
            var issues = new HashSet<string>();

            var matches = issuePattern.Matches(logOutput);
            foreach (Match match in matches)
            {
                var issue = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
                if (!string.IsNullOrEmpty(issue))
                {
                    issues.Add(issue);
                }
            }

            var result = issues.OrderBy(i => int.TryParse(i, out var num) ? num : int.MaxValue).ToList();
            Log.Information("仓库共找到 {Count} 个 Issue 编号", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "扫描仓库获取所有 Issue 编号失败, 仓库路径: {RepoPath}", repoPath);
            return [];
        }
    }
}