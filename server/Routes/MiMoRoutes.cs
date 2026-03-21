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
        var group = app.MapGroup("/api/mimo")
            .WithTags("MiMo")
            .WithGroupName("v1");

        /// <summary>
        /// 根据 Hg 文件变更信息调用 LLM 生成修改说明
        /// </summary>
        /// <param name="request">修改请求参数</param>
        /// <returns>生成的修改说明</returns>
        /// <response code="200">成功生成修改说明</response>
        /// <response code="400">缺少必要参数</response>
        /// <response code="500">服务器内部错误</response>
        group.MapPost("/generate-modification", async Task<IResult> (ModificationRequest? request) =>
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
        })
        .WithName("GenerateModification")
        .WithSummary("生成修改说明")
        .WithDescription("根据 Hg 文件变更信息调用 MiMo LLM 生成修改说明文档")
        .Produces<ApiResponse<ModificationResponse>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<ModificationResponse>>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}