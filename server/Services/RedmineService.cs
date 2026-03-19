using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using IssuerServer.Models;
using Serilog;

namespace IssuerServer.Services;

/// <summary>
/// Redmine 项目管理服务
/// </summary>
public class RedmineService
{
    private const string RedmineBaseUrl = "http://10.0.0.19/redmine";
    private const string RedmineUser = "cheng_zhuo";
    private const string RedminePassword = "Rde@0224";

    private readonly HttpClient _httpClient;

    public RedmineService()
    {
        _httpClient = new HttpClient();
        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{RedmineUser}:{RedminePassword}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
        Log.Information("RedmineService 已初始化, 目标地址: {BaseUrl}", RedmineBaseUrl);
    }

    private async Task<JsonElement> GetAsync(string url)
    {
        Log.Debug("Redmine API 请求: {Url}", url);
        
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            Log.Error("Redmine API 请求失败: {StatusCode}, Url: {Url}", response.StatusCode, url);
            throw new Exception($"Redmine API error: {response.StatusCode}");
        }
        
        var json = await response.Content.ReadAsStringAsync();
        Log.Debug("Redmine API 响应长度: {Length}", json.Length);
        return JsonDocument.Parse(json).RootElement;
    }

    /// <summary>
    /// 获取所有项目列表
    /// </summary>
    public async Task<List<RedmineProject>> GetProjects()
    {
        try
        {
            Log.Information("获取 Redmine 项目列表");
            
            var data = await GetAsync($"{RedmineBaseUrl}/projects.json?limit=100");
            var projects = data.GetProperty("projects");
            var result = projects.EnumerateArray().Select(p => new RedmineProject
            {
                Id = p.GetProperty("id").GetInt32().ToString(),
                Name = p.GetProperty("name").GetString() ?? string.Empty
            }).ToList();

            Log.Information("成功获取 {Count} 个 Redmine 项目", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取 Redmine 项目列表失败");
            throw;
        }
    }

    /// <summary>
    /// 获取指定项目的所有 issues
    /// </summary>
    public async Task<List<RedmineIssue>> GetAllIssuesByProject(string projectId, int userId)
    {
        try
        {
            Log.Information("获取项目 {ProjectId} 用户 {UserId} 的所有 issues", projectId, userId);
            
            var allIssues = new List<RedmineIssue>();
            var offset = 0;
            var limit = 100;

            while (true)
            {
                var url = $"{RedmineBaseUrl}/issues.json?project_id={projectId}&status_id=*&cf_29={userId}&limit={limit}&offset={offset}";
                var data = await GetAsync(url);
                var issues = data.GetProperty("issues");

                foreach (var issue in issues.EnumerateArray())
                {
                    var customFields = issue.GetProperty("custom_fields");
                    string? resolvedDate = null;
                    foreach (var cf in customFields.EnumerateArray())
                    {
                        if (cf.GetProperty("id").GetInt32() == 30)
                        {
                            resolvedDate = cf.GetProperty("value").GetString();
                            break;
                        }
                    }

                    var assignedTo = issue.TryGetProperty("assigned_to", out var at) && at.ValueKind != JsonValueKind.Null
                        ? at.GetProperty("name").GetString()
                        : null;

                    allIssues.Add(new RedmineIssue
                    {
                        Id = issue.GetProperty("id").GetInt32(),
                        Subject = issue.GetProperty("subject").GetString() ?? string.Empty,
                        Tracker = issue.TryGetProperty("tracker", out var t) ? t.GetProperty("name").GetString() : null,
                        Priority = issue.TryGetProperty("priority", out var p) ? p.GetProperty("name").GetString() : null,
                        EstimatedHours = issue.TryGetProperty("estimated_hours", out var eh) && eh.ValueKind == JsonValueKind.Number ? eh.GetDouble() : 0,
                        SpentHours = issue.TryGetProperty("total_spent_hours", out var tsh) && tsh.ValueKind == JsonValueKind.Number ? tsh.GetDouble() : 0,
                        AssignedTo = assignedTo,
                        StartDate = issue.TryGetProperty("start_date", out var sd) ? sd.GetString() : null,
                        DueDate = issue.TryGetProperty("due_date", out var dd) ? dd.GetString() : null,
                        CreatedOn = issue.GetProperty("created_on").GetString() ?? string.Empty,
                        ResolvedDate = resolvedDate ?? (issue.TryGetProperty("closed_on", out var co) ? co.GetString() : null),
                        ProjectId = projectId
                    });
                }

                var totalCount = data.GetProperty("total_count").GetInt32();
                Log.Debug("已获取 {Offset}/{Total} 条 issues", allIssues.Count, totalCount);
                
                if (issues.GetArrayLength() == 0 || allIssues.Count >= totalCount) break;

                offset += limit;
            }

            Log.Information("项目 {ProjectId} 共获取 {Count} 个 issues", projectId, allIssues.Count);
            return allIssues;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取项目 {ProjectId} 的 issues 失败", projectId);
            throw;
        }
    }

    /// <summary>
    /// 按用户和年份统计 issues
    /// </summary>
    public async Task<(int Count, List<RedmineIssue> Issues)> GetIssuesByPICAndYear(int userId, int year)
    {
        try
        {
            Log.Information("获取用户 {UserId} 在 {Year} 年创建的 issues", userId, year);
            
            var allIssues = new List<RedmineIssue>();
            var offset = 0;
            var limit = 100;
            var startDate = $"{year}-01-01";
            var endDate = $"{year}-12-31";

            while (true)
            {
                var url = $"{RedmineBaseUrl}/issues.json?cf_29={userId}&created_on=>={startDate}&created_on=<<={endDate}&limit={limit}&offset={offset}";
                var data = await GetAsync(url);
                var issues = data.GetProperty("issues");

                foreach (var issue in issues.EnumerateArray())
                {
                    allIssues.Add(new RedmineIssue
                    {
                        Id = issue.GetProperty("id").GetInt32(),
                        Subject = issue.GetProperty("subject").GetString() ?? string.Empty,
                        CreatedOn = issue.GetProperty("created_on").GetString() ?? string.Empty,
                        ResolvedDate = issue.TryGetProperty("closed_on", out var co) ? co.GetString() : null
                    });
                }

                var totalCount = data.GetProperty("total_count").GetInt32();
                if (allIssues.Count >= totalCount) break;

                offset += limit;
            }

            Log.Information("用户 {UserId} 在 {Year} 年共有 {Count} 个 issues", userId, year, allIssues.Count);
            return (allIssues.Count, allIssues);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "获取用户 {UserId} 在 {Year} 年的 issues 失败", userId, year);
            throw;
        }
    }
}