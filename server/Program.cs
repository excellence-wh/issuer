using IssuerServer.Routes;
using IssuerServer.Services;
using Serilog;

// 使用 appsettings.json 中的 Serilog 配置


// 全局异常处理
try
{
    Log.Information("IssuerServer 正在启动...");

    var builder = WebApplication.CreateBuilder(args);
    Log.Logger = new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
        .CreateLogger();

    #region 服务配置

    // 添加 OpenAPI 和 Swagger 支持（用于生成 API 文档）
    builder.Services.AddOpenApi();

    // 配置 Swagger 生成选项
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "Excellence Issuer API",
            Description =
                "API documentation for Excellence Issuer Server - 提供 Hg 版本控制、Redmine 项目管理、MiMo LLM 集成的 REST API 接口"
        });

        // 启用 XML 注释解析
        var xmlFileName = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlFilePath = Path.Combine(AppContext.BaseDirectory, xmlFileName);
        if (File.Exists(xmlFilePath))
        {
            options.IncludeXmlComments(xmlFilePath, true);
        }

        // 启用模型 XML 注释解析
        var modelXmlFilePath = Path.Combine(AppContext.BaseDirectory, "IssuerServer.Models.xml");
        if (File.Exists(modelXmlFilePath))
        {
            options.IncludeXmlComments(modelXmlFilePath, true);
        }

        // 启用服务 XML 注释解析
        var serviceXmlFilePath = Path.Combine(AppContext.BaseDirectory, "IssuerServer.Services.xml");
        if (File.Exists(serviceXmlFilePath))
        {
            options.IncludeXmlComments(serviceXmlFilePath, true);
        }

        // 启用路由 XML 注释解析
        var routesXmlFilePath = Path.Combine(AppContext.BaseDirectory, "IssuerServer.Routes.xml");
        if (File.Exists(routesXmlFilePath))
        {
            options.IncludeXmlComments(routesXmlFilePath, true);
        }

        // 为所有操作添加 API 版本信息
        options.CustomOperationIds(apiDesc =>
        {
            return apiDesc.ActionDescriptor.AttributeRouteInfo?.Name ?? apiDesc.HttpMethod + apiDesc.RelativePath;
        });
    });

    // 添加 CORS 跨域支持（允许所有来源、所有方法、所有头部）
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    });

    // 注册业务服务到依赖注入容器（单例模式）
    builder.Services.AddSingleton<HgService>();
    builder.Services.AddSingleton<RedmineService>();
    builder.Services.AddSingleton<MiMoService>();
    // Port monitor 服务与命令执行器
    builder.Services.Configure<IssuerServer.Models.PortMonitorOptions>(builder.Configuration.GetSection("PortMonitor"));
    builder.Services.AddSingleton<ICommandExecutor, CommandExecutor>();
    builder.Services.AddHostedService<PortMonitorService>();

    // 将主机配置为作为 Windows Service 运行
    builder.Host.UseWindowsService();

    // 将 Serilog 添加到主机（从 appsettings.json 读取配置）
    builder.Host.UseSerilog();

    #endregion

    #region 中间件配置

    var app = builder.Build();

    // 应用 CORS 中间件
    app.UseCors("AllowAll");


    // 启用 OpenAPI 文档生成
    app.MapOpenApi();

    // 配置 Swagger UI（可视化 API 文档页面）
    app.UseSwaggerUI(options =>
    {
        options.DocumentTitle = "Excellence Issuer API";
        options.SwaggerEndpoint("/openapi/v1.json", "API V1");
    });

    #endregion

    #region 路由配置

    // 根路径 - 用于健康检查
    app.MapGet("/", () =>
    {
        Log.Information("健康检查接口被调用");
        return "Issuer Server Started!";
    });

    // 注册各功能模块的路由
    app.MapHgRoutes(); // Hg 版本控制相关接口
    app.MapRedmineRoutes(); // Redmine 项目管理相关接口
    app.MapMiMoRoutes(); // MiMo LLM 集成相关接口

    // API 文档路径 - 自动重定向到 Swagger UI
    app.MapGet("/docs", () => Results.Redirect("/swagger/index.html"));

    #endregion

    #region 服务启动

    // 监听端口 3001（与原 Hono 服务器保持一致）
    app.Run("http://0.0.0.0:3001");

    #endregion
}
catch (Exception ex)
{
    Log.Fatal(ex, "IssuerServer 启动失败");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
