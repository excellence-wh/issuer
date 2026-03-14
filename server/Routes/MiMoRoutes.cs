using IssuerServer.Models;
using IssuerServer.Services;

namespace IssuerServer.Routes;

/// <summary>
/// MiMo LLM 集成相关的 API 路由
/// </summary>
public static class MiMoRoutes
{
    public static void MapMiMoRoutes(this IEndpointRouteBuilder app)
    {
        var mimoService = app.ServiceProvider.GetRequiredService<MiMoService>();
        var group = app.MapGroup("/api/mimo");

        // 根据 Hg 文件变更信息调用 LLM 生成修改说明
        // POST /api/mimo/generate-modification
        group.MapPost("/generate-modification", async (ModificationRequest? request) =>
        {
            // 验证请求参数
            if (request?.Files == null || request.Files.Count == 0)
            {
                return Results.BadRequest(ApiResponse<ModificationResponse>.Fail("Missing files parameter"));
            }

            try
            {
                // 调用 MiMo LLM 服务生成修改说明
                var modification = await mimoService.GenerateModificationFromHg(request.Files, request.Description ?? string.Empty);
                return Results.Ok(ApiResponse<ModificationResponse>.Ok(new ModificationResponse { Modification = modification }));
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });
    }
}