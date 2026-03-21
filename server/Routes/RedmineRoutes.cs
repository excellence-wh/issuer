using IssuerServer.Models;
using IssuerServer.Services;

namespace IssuerServer.Routes;

/// <summary>
/// Redmine 项目管理相关的 API 路由
/// </summary>
public static class RedmineRoutes
{
    public static void MapRedmineRoutes(this IEndpointRouteBuilder app)
    {
        var redmineService = app.ServiceProvider.GetRequiredService<RedmineService>();
        var group = app.MapGroup("/api/redmine")
            .WithTags("Redmine")
            .WithGroupName("v1");

        /// <summary>
        /// 获取 Redmine 所有项目列表
        /// </summary>
        /// <returns>项目列表</returns>
        /// <response code="200">成功获取项目列表</response>
        /// <response code="500">服务器内部错误</response>
        group.MapGet("/projects", async Task<IResult> () =>
        {
            try
            {
                var projects = await redmineService.GetProjects();
                return Results.Ok(ApiResponse<List<RedmineProject>>.Ok(projects));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetRedmineProjects")
        .WithSummary("获取所有项目")
        .WithDescription("获取 Redmine 中所有项目的列表")
        .Produces<ApiResponse<List<RedmineProject>>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);

        /// <summary>
        /// 获取指定项目在指定日期范围内的已解决 issues（用于周报）
        /// </summary>
        /// <param name="projectId">项目 ID</param>
        /// <param name="startDate">开始日期 (yyyy-MM-dd)</param>
        /// <param name="endDate">结束日期 (yyyy-MM-dd)</param>
        /// <returns>Issue 列表</returns>
        /// <response code="200">成功获取 issue 列表</response>
        /// <response code="400">缺少必要参数</response>
        /// <response code="500">服务器内部错误</response>
        group.MapGet("/weekly-issues", async Task<IResult> (string? projectId, string? startDate, string? endDate) =>
        {
            if (string.IsNullOrEmpty(projectId))
            {
                return Results.BadRequest(ApiResponse<List<RedmineIssue>>.Fail("Missing projectId parameter"));
            }

            try
            {
                // 固定用户 ID 为 654（负责人的 custom field）
                var userId = 654;
                var allIssues = await redmineService.GetAllIssuesByProject(projectId, userId);

                // 按日期范围筛选已解决的 issues
                var issuesInPeriod = allIssues.Where(i =>
                {
                    if (string.IsNullOrEmpty(i.ResolvedDate)) return false;
                    if (!string.IsNullOrEmpty(startDate) && string.Compare(i.ResolvedDate!, startDate, StringComparison.Ordinal) < 0) return false;
                    if (!string.IsNullOrEmpty(endDate) && string.Compare(i.ResolvedDate!, endDate, StringComparison.Ordinal) > 0) return false;
                    return true;
                }).Select(i => new RedmineIssue
                {
                    Id = i.Id,
                    Subject = i.Subject,
                    Tracker = i.Tracker,
                    Priority = i.Priority,
                    EstimatedHours = i.EstimatedHours,
                    SpentHours = i.SpentHours,
                    AssignedTo = i.AssignedTo,
                    StartDate = i.StartDate,
                    DueDate = i.DueDate,
                    CreatedOn = i.CreatedOn,
                    ResolvedDate = i.ResolvedDate,
                    ProjectId = projectId
                }).ToList();

                return Results.Ok(ApiResponse<List<RedmineIssue>>.Ok(issuesInPeriod));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetWeeklyIssues")
        .WithSummary("获取周报 issue 列表")
        .WithDescription("获取指定项目在日期范围内已解决的 issue 列表，用于生成周报")
        .Produces<ApiResponse<List<RedmineIssue>>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<List<RedmineIssue>>>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status500InternalServerError);

        /// <summary>
        /// 统计指定用户在某年创建的 issue 数量
        /// </summary>
        /// <param name="year">年份 (2000-2100)</param>
        /// <param name="userId">用户 ID</param>
        /// <returns>Issue 数量统计</returns>
        /// <response code="200">成功获取统计数据</response>
        /// <response code="400">参数无效</response>
        /// <response code="500">服务器内部错误</response>
        group.MapGet("/issues/count", async Task<IResult> (string? year, string? userId) =>
        {
            // 验证年份参数
            if (!int.TryParse(year, out var parsedYear) || parsedYear < 2000 || parsedYear > 2100)
            {
                return Results.BadRequest(ApiResponse<IssuesCountResponse>.Fail("Invalid year parameter"));
            }

            // 验证用户 ID 参数
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var parsedUserId))
            {
                return Results.BadRequest(ApiResponse<IssuesCountResponse>.Fail("Missing userId parameter"));
            }

            try
            {
                var result = await redmineService.GetIssuesByPICAndYear(parsedUserId, parsedYear);
                return Results.Ok(ApiResponse<IssuesCountResponse>.Ok(new IssuesCountResponse
                {
                    Year = parsedYear,
                    UserId = parsedUserId,
                    Count = result.Count
                }));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetIssuesCount")
        .WithSummary("统计用户 issue 数量")
        .WithDescription("统计指定用户在某年创建的 issue 数量")
        .Produces<ApiResponse<IssuesCountResponse>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<IssuesCountResponse>>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status500InternalServerError);

        /// <summary>
        /// 获取指定用户在某年创建的所有 issue 列表
        /// </summary>
        /// <param name="year">年份 (2000-2100)</param>
        /// <param name="userId">用户 ID</param>
        /// <returns>Issue 列表</returns>
        /// <response code="200">成功获取 issue 列表</response>
        /// <response code="400">参数无效</response>
        /// <response code="500">服务器内部错误</response>
        group.MapGet("/issues", async Task<IResult> (string? year, string? userId) =>
        {
            // 验证年份参数
            if (!int.TryParse(year, out var parsedYear) || parsedYear < 2000 || parsedYear > 2100)
            {
                return Results.BadRequest(ApiResponse<object>.Fail("Invalid year parameter"));
            }

            // 验证用户 ID 参数
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var parsedUserId))
            {
                return Results.BadRequest(ApiResponse<object>.Fail("Missing userId parameter"));
            }

            try
            {
                var result = await redmineService.GetIssuesByPICAndYear(parsedUserId, parsedYear);
                return Results.Ok(ApiResponse<object>.Ok(new
                {
                    Year = parsedYear,
                    UserId = parsedUserId,
                    Count = result.Count,
                    Issues = result.Issues.Select(i => new
                    {
                        Id = i.Id,
                        Subject = i.Subject,
                        Status = "Closed",
                        CreatedOn = i.CreatedOn,
                        ClosedOn = i.ResolvedDate
                    }).ToList()
                }));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("GetIssuesByYear")
        .WithSummary("获取用户 issue 列表")
        .WithDescription("获取指定用户在某年创建的所有 issue 列表")
        .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status500InternalServerError);

        /// <summary>
        /// 手动触发 PortMonitor 的检查
        /// </summary>
        /// <returns>触发结果</returns>
        /// <response code="200">成功触发检查</response>
        /// <response code="500">服务器内部错误</response>
        group.MapPost("/trigger-port-monitor", async Task<IResult> (IServiceProvider sp) =>
        {
            try
            {
                var svc = sp.GetService<PortMonitorService>();
                if (svc == null)
                {
                    return Results.Problem("PortMonitorService not registered");
                }

                // 不等待太久，传入短超时
                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                await svc.TriggerOnceAsync(cts.Token);
                return Results.Ok(ApiResponse<object>.Ok(new { Message = "Trigger executed" }));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("TriggerPortMonitor")
        .WithSummary("触发端口监控检查")
        .WithDescription("手动触发 PortMonitor 服务进行一次端口检查")
        .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);

        /// <summary>
        /// Kill listeners on configured port and disable monitoring
        /// </summary>
        /// <returns>Kill 结果</returns>
        /// <response code="200">成功停止监听</response>
        /// <response code="500">服务器内部错误</response>
        group.MapPost("/kill-and-stop", async Task<IResult> (IServiceProvider sp) =>
        {
            try
            {
                var svc = sp.GetService<PortMonitorService>();
                if (svc == null) return Results.Problem("PortMonitorService not registered");

                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                var killed = await svc.KillListenersAsync(cts.Token);
                // disable further automatic monitoring
                svc.DisableMonitoring();

                return Results.Ok(ApiResponse<object>.Ok(new { KilledPids = killed }));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithName("KillAndStop")
        .WithSummary("停止端口监听")
        .WithDescription("Kill 监听指定端口的进程并禁用监控")
        .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}