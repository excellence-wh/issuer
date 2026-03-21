namespace IssuerServer.Models;

/// <summary>
/// 文件变更信息
/// </summary>
public class FileChangeInfo
{
    /// <summary>
    /// 文件路径
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// 变更状态 (A=新增, M=修改, D=删除)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 版本号
    /// </summary>
    public string Revision { get; set; } = string.Empty;
}

/// <summary>
/// Issue 信息
/// </summary>
public class IssueInfo
{
    /// <summary>
    /// 版本号
    /// </summary>
    public string Revision { get; set; } = string.Empty;

    /// <summary>
    /// 节点标识
    /// </summary>
    public string Node { get; set; } = string.Empty;

    /// <summary>
    /// 作者
    /// </summary>
    public string Author { get; set; } = string.Empty;

    /// <summary>
    /// 提交日期
    /// </summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// 提交摘要
    /// </summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// 变更文件列表
    /// </summary>
    public List<FileChangeInfo> Files { get; set; } = [];
}

/// <summary>
/// API 响应包装类
/// </summary>
/// <typeparam name="T">响应数据类型</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 响应数据
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// 创建成功响应
    /// </summary>
    /// <param name="data">响应数据</param>
    /// <returns>成功响应</returns>
    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };

    /// <summary>
    /// 创建失败响应
    /// </summary>
    /// <param name="error">错误信息</param>
    /// <returns>失败响应</returns>
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };
}

/// <summary>
/// 修改说明生成请求
/// </summary>
public class ModificationRequest
{
    /// <summary>
    /// 文件变更列表
    /// </summary>
    public List<FileChangeInfo> Files { get; set; } = [];

    /// <summary>
    /// 额外描述信息
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// 修改说明生成响应
/// </summary>
public class ModificationResponse
{
    /// <summary>
    /// 生成的修改说明
    /// </summary>
    public string Modification { get; set; } = string.Empty;
}

/// <summary>
/// Diff 响应
/// </summary>
public class DiffResponse
{
    /// <summary>
    /// Diff 内容
    /// </summary>
    public string Diff { get; set; } = string.Empty;
}

/// <summary>
/// Issue 列表响应
/// </summary>
public class IssuesResponse
{
    /// <summary>
    /// Issue 编号列表
    /// </summary>
    public List<string> Issues { get; set; } = [];
}

/// <summary>
/// Issue 数量统计响应
/// </summary>
public class IssuesCountResponse
{
    /// <summary>
    /// 年份
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// 用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Issue 数量
    /// </summary>
    public int Count { get; set; }
}

/// <summary>
/// Redmine 项目信息
/// </summary>
public class RedmineProject
{
    /// <summary>
    /// 项目 ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 项目名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Redmine Issue 信息
/// </summary>
public class RedmineIssue
{
    /// <summary>
    /// Issue ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Issue 主题
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 跟踪类型
    /// </summary>
    public string? Tracker { get; set; }

    /// <summary>
    /// 优先级
    /// </summary>
    public string? Priority { get; set; }

    /// <summary>
    /// 预估工时
    /// </summary>
    public double EstimatedHours { get; set; }

    /// <summary>
    /// 已花费工时
    /// </summary>
    public double SpentHours { get; set; }

    /// <summary>
    /// 负责人
    /// </summary>
    public string? AssignedTo { get; set; }

    /// <summary>
    /// 开始日期
    /// </summary>
    public string? StartDate { get; set; }

    /// <summary>
    /// 截止日期
    /// </summary>
    public string? DueDate { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public string CreatedOn { get; set; } = string.Empty;

    /// <summary>
    /// 解决日期
    /// </summary>
    public string? ResolvedDate { get; set; }

    /// <summary>
    /// 项目 ID
    /// </summary>
    public string ProjectId { get; set; } = string.Empty;
}