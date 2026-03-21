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
        var group = app.MapGroup("/api/hg")
            .WithTags("Hg")
            .WithGroupName("v1");

        /// <summary>
        /// 获取指定 issue 对应的 changeset 信息
        /// </summary>
        /// <param name="issue">Issue 编号</param>
        /// <param name="repoPath">仓库路径</param>
        /// <param name="hgService">Hg 服务实例</param>
        /// <returns>Changeset 信息</returns>
        /// <response code="200">成功获取 changeset 信息</response>
        /// <response code="400">缺少必要参数</response>
        /// <response code="404">未找到对应的 changeset</response>
        group.MapGet("/changeset", async Task<IResult> (string? issue, string? repoPath, HgService hgService) =>
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
        })
        .WithName("GetChangesetByIssue")
        .WithSummary("获取 issue 对应的 changeset")
        .WithDescription("根据 issue 编号和仓库路径获取对应的版本控制变更集信息")
        .Produces<ApiResponse<IssueInfo>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<IssueInfo>>(StatusCodes.Status400BadRequest)
        .Produces<ApiResponse<IssueInfo>>(StatusCodes.Status404NotFound);

        /// <summary>
        /// 获取指定 issue 变更的文件列表
        /// </summary>
        /// <param name="issue">Issue 编号</param>
        /// <param name="repoPath">仓库路径</param>
        /// <param name="allHistory">是否获取所有历史记录</param>
        /// <param name="hgService">Hg 服务实例</param>
        /// <returns>文件变更列表</returns>
        /// <response code="200">成功获取文件列表</response>
        /// <response code="400">缺少必要参数</response>
        group.MapGet("/files", async Task<IResult> (string? issue, string? repoPath, bool allHistory, HgService hgService) =>
        {
            if (string.IsNullOrEmpty(issue) || string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<List<FileChangeInfo>>.Fail("Missing issue or repoPath parameter"));
            }

            var files = allHistory
                ? await hgService.GetAllFilesByIssue(issue, repoPath)
                : await hgService.GetFilesByIssue(issue, repoPath);

            return Results.Ok(ApiResponse<List<FileChangeInfo>>.Ok(files));
        })
        .WithName("GetFilesByIssue")
        .WithSummary("获取 issue 变更的文件列表")
        .WithDescription("根据 issue 编号获取该 issue 涉及的文件变更列表，可选择是否包含所有历史记录")
        .Produces<ApiResponse<List<FileChangeInfo>>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<List<FileChangeInfo>>>(StatusCodes.Status400BadRequest);

        /// <summary>
        /// 获取指定 issue 的 diff 内容
        /// </summary>
        /// <param name="issue">Issue 编号</param>
        /// <param name="repoPath">仓库路径</param>
        /// <param name="hgService">Hg 服务实例</param>
        /// <returns>Diff 内容</returns>
        /// <response code="200">成功获取 diff 内容</response>
        /// <response code="400">缺少必要参数</response>
        group.MapGet("/diff", async Task<IResult> (string? issue, string? repoPath, HgService hgService) =>
        {
            if (string.IsNullOrEmpty(issue) || string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<DiffResponse>.Fail("Missing issue or repoPath parameter"));
            }

            var diff = await hgService.GetFilesDiffByIssue(issue, repoPath);
            return Results.Ok(ApiResponse<DiffResponse>.Ok(new DiffResponse { Diff = diff }));
        })
        .WithName("GetDiffByIssue")
        .WithSummary("获取 issue 的 diff 内容")
        .WithDescription("根据 issue 编号获取文件变更的差异内容")
        .Produces<ApiResponse<DiffResponse>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<DiffResponse>>(StatusCodes.Status400BadRequest);

        /// <summary>
        /// 获取仓库中所有包含 issue 编号的提交
        /// </summary>
        /// <param name="repoPath">仓库路径</param>
        /// <param name="hgService">Hg 服务实例</param>
        /// <returns>Issue 编号列表</returns>
        /// <response code="200">成功获取 issue 列表</response>
        /// <response code="400">缺少必要参数</response>
        group.MapGet("/issues", async Task<IResult> (string? repoPath, HgService hgService) =>
        {
            if (string.IsNullOrEmpty(repoPath))
            {
                return Results.BadRequest(ApiResponse<IssuesResponse>.Fail("Missing repoPath parameter"));
            }

            var issues = await hgService.GetAllIssueNumbers(repoPath);
            return Results.Ok(ApiResponse<IssuesResponse>.Ok(new IssuesResponse { Issues = issues }));
        })
        .WithName("GetAllIssueNumbers")
        .WithSummary("获取仓库中所有 issue 编号")
        .WithDescription("获取指定仓库中所有包含 issue 编号的提交记录")
        .Produces<ApiResponse<IssuesResponse>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<IssuesResponse>>(StatusCodes.Status400BadRequest);
    }
}