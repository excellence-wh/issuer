namespace IssuerServer.Models;

public class FileChangeInfo
{
    public string Path { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Revision { get; set; } = string.Empty;
}

public class IssueInfo
{
    public string Revision { get; set; } = string.Empty;
    public string Node { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<FileChangeInfo> Files { get; set; } = [];
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };
}

public class ModificationRequest
{
    public List<FileChangeInfo> Files { get; set; } = [];
    public string Description { get; set; } = string.Empty;
}

public class ModificationResponse
{
    public string Modification { get; set; } = string.Empty;
}

public class DiffResponse
{
    public string Diff { get; set; } = string.Empty;
}

public class IssuesResponse
{
    public List<string> Issues { get; set; } = [];
}

public class IssuesCountResponse
{
    public int Year { get; set; }
    public int UserId { get; set; }
    public int Count { get; set; }
}

public class RedmineProject
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class RedmineIssue
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Tracker { get; set; }
    public string? Priority { get; set; }
    public double EstimatedHours { get; set; }
    public string? AssignedTo { get; set; }
    public string? StartDate { get; set; }
    public string? DueDate { get; set; }
    public string CreatedOn { get; set; } = string.Empty;
    public string? ResolvedDate { get; set; }
    public string ProjectId { get; set; } = string.Empty;
}