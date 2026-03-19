using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using IssuerServer.Models;
using Serilog;

namespace IssuerServer.Services;

/// <summary>
/// DeepSeek LLM 集成服务
/// </summary>
public class MiMoService
{
    private const string BaseUrl = "https://ai.xingr.com/v1";
    private const string ApiKey = "no-needed";
    private const string Model = "deepseek-v32-exp";

    private readonly HttpClient _httpClient;

    public MiMoService()
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("api-key", ApiKey);
        Log.Information("LocalModelService 已初始化, 模型: {Model}", Model);
    }

    /// <summary>
    /// 调用 MiMo LLM 完成对话
    /// </summary>
    private async Task<string> Complete(string systemPrompt, string userPrompt)
    {
        try
        {
            Log.Information("调用 LocalModel API, Model: {Model}", Model);
            
            var requestBody = new
            {
                model = Model,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                max_tokens = 4096,
                temperature = 0.2,
                top_p = 0.85,
                frequency_penalty = 0,
                presence_penalty = 0,
                seed = 42
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{BaseUrl}/chat/completions", content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Log.Error("LocalModel API 请求失败: {StatusCode}, Error: {Error}", response.StatusCode, error);
                throw new Exception($"LocalModel API error: {response.StatusCode} - {error}");
            }

            var responseJson = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var contentResult = responseJson.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? string.Empty;

            Log.Information("LocalModel 响应长度: {Length}", contentResult.Length);
            return contentResult;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "调用 LocalModel 失败");
            throw;
        }
    }

    /// <summary>
    /// 根据 Hg 文件变更生成修改说明
    /// </summary>
    /// <param name="files">变更文件列表</param>
    /// <param name="description">问题描述</param>
    /// <returns>生成的修改说明</returns>
    public async Task<string> GenerateModificationFromHg(List<FileChangeInfo> files, string description)
    {
        try
        {
            Log.Information("生成修改说明, 文件数量: {FileCount}, 描述: {Description}", 
                files.Count, 
                string.IsNullOrEmpty(description) ? "无" : description.Substring(0, Math.Min(50, description.Length)));

            var systemPrompt = @"你是一个代码审查助手，帮助工程师根据代码变更生成修改说明。请根据提供的代码变更信息，生成清晰、简洁的修改说明，用中文回复。

要求：
- 只输出修改说明，不要添加其他内容
- 说明修改了哪些文件，做了什么变更
- 保持简洁，突出重点";

            var statusMap = new Dictionary<string, string>
            {
                { "A", "新增" },
                { "M", "修改" },
                { "D", "删除" },
                { "R", "重命名" }
            };

            var fileList = string.Join("\n", files.Select(f => $"[{statusMap.GetValueOrDefault(f.Status, f.Status)}] {f.Path}"));
            var userPrompt = $@"请根据以下代码变更信息，生成修改说明：

**问题描述**:
{description ?? "无"}

**变更的文件**:
{fileList ?? "无"}

请简要说明这些修改的内容和目的。";

            var result = await Complete(systemPrompt, userPrompt);
            
            Log.Information("成功生成修改说明, 长度: {Length}", result.Length);
            return result;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "生成修改说明失败");
            throw;
        }
    }
}