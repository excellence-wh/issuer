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
        var group = app.MapGroup("/api/redmine");

        // 获取 Redmine 所有项目列表
        // GET /api/redmine/projects
        group.MapGet("/projects", async () =>
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
        });

        // 获取指定项目在指定日期范围内的已解决 issues（用于周报）
        // GET /api/redmine/weekly-issues?projectId=&startDate=&endDate=
        group.MapGet("/weekly-issues", async (string? projectId, string? startDate, string? endDate) =>
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
        });

        // 统计指定用户在某年创建的 issue 数量
        // GET /api/redmine/issues/count?year=&userId=
        group.MapGet("/issues/count", async (string? year, string? userId) =>
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
        });

        // 获取指定用户在某年创建的所有 issue 列表
        // GET /api/redmine/issues?year=&userId=
        group.MapGet("/issues", async (string? year, string? userId) =>
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
        });

        // 手动触发 PortMonitor 的检查（POST /api/redmine/trigger-port-monitor）
        group.MapPost("/trigger-port-monitor", async (IServiceProvider sp) =>
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
        });
    }
}
