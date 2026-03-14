using IssuerServer.Models;
using IssuerServer.Services;

namespace IssuerServer.Routes;

/// <summary>
/// Hg 版本控制相关的 API 路由
/// </summary>
public static class HgRoutes
{
    public static void MapHgRoutes(this IEndpointRouteBuilder app)
    {
        var hgService = app.ServiceProvider.GetRequiredService<HgService>();
        var group = app.MapGroup("/api/hg");

        // 获取指定 issue 对应的 changeset 信息
        // GET /api/hg/changeset?issue=&repoPath=
        group.MapGet("/changeset", async (string? issue, string? repoPath) =>
        {
            if (string.IsNullOrEmpty(issue) || string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<IssueInfo>.Fail("Missing issue or repoPath parameter"));
            }

            var changeset = await hgService.GetChangesetByIssue(issue, repoPath);
            if (changeset == null)
            {
                return Results.NotFound(ApiResponse<IssueInfo>.Fail("Changeset not found"));
            }

            return Results.Ok(ApiResponse<IssueInfo>.Ok(changeset));
        });

        // 获取指定 issue 变更的文件列表
        // GET /api/hg/files?issue=&repoPath=&allHistory=
        group.MapGet("/files", async (string? issue, string? repoPath, bool allHistory = false) =>
        {
            if (string.IsNullOrEmpty(issue) || string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<List<FileChangeInfo>>.Fail("Missing issue or repoPath parameter"));
            }

            var files = allHistory
                ? await hgService.GetAllFilesByIssue(issue, repoPath)
                : await hgService.GetFilesByIssue(issue, repoPath);

            return Results.Ok(ApiResponse<List<FileChangeInfo>>.Ok(files));
        });

        // 获取指定 issue 的 diff 内容
        // GET /api/hg/diff?issue=&repoPath=
        group.MapGet("/diff", async (string? issue, string? repoPath) =>
        {
            if (string.IsNullOrEmpty(issue) || string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<DiffResponse>.Fail("Missing issue or repoPath parameter"));
            }

            var diff = await hgService.GetFilesDiffByIssue(issue, repoPath);
            return Results.Ok(ApiResponse<DiffResponse>.Ok(new DiffResponse { Diff = diff }));
        });

        // 获取仓库中所有包含 issue 编号的提交
        // GET /api/hg/issues?repoPath=
        group.MapGet("/issues", async (string? repoPath) =>
        {
            if (string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<IssuesResponse>.Fail("Missing repoPath parameter"));
            }

            var issues = await hgService.GetAllIssueNumbers(repoPath);
            return Results.Ok(ApiResponse<IssuesResponse>.Ok(new IssuesResponse { Issues = issues }));
        });
    }
}