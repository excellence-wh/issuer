# TicketQ 后台监控与自恢复设计

日期: 2026-03-20

目的
- 实现一个在 Issuer Server 进程内运行的后台任务（TicketQ/PortMonitor），用于每 15 分钟检查本机 6060 端口是否有程序在监听；若没有监听，则在本机执行配置的命令以启动/重启目标程序，并记录结果与重试信息。

设计要点
- 运行位置：与 Issuer Server 同一进程，作为 .NET `BackgroundService`（Windows Service 下运行）。
- 检查方式：使用 `TcpClient` 在短超时内尝试连接 `127.0.0.1:6060`，判断端口是否可达。
- 启动方式：命令由配置提供（`Command`, `Args`, `WorkingDirectory`），通过 `ProcessStartInfo` 启动并捕获 stdout/stderr 与 exit code。
- 可配置项：检查间隔、超时时间、最大重试次数、重试退避时间、是否启用。

配置（示例，添加到 `server/appsettings.json`）

```json
"PortMonitor": {
  "Enabled": true,
  "IntervalMinutes": 15,
  "Host": "127.0.0.1",
  "Port": 6060,
  "TimeoutMs": 2000,
  "Command": "C:\\path\\to\\restart-script.bat",
  "Args": "",
  "WorkingDirectory": "C:\\path\\to",
  "MaxRetries": 1,
  "RetryBackoffSeconds": 30
}
```

主要组件与接口
- PortMonitorService : `BackgroundService`
  - 责任：按配置周期执行检查；在检测到端口未响应时触发命令执行；处理并发保护与重试。
  - 依赖注入：`IOptions<PortMonitorOptions>`、`ICommandExecutor`、`ILogger<...>`。

- PortMonitorOptions
  - 字段：Enabled, IntervalMinutes, Host, Port, TimeoutMs, Command, Args, WorkingDirectory, MaxRetries, RetryBackoffSeconds

- ICommandExecutor
  - 方法：`Task<CommandResult> ExecuteAsync(string command, string args, string workingDir, int timeoutMs, CancellationToken ct)`
  - CommandResult 包含：ExitCode, Stdout, Stderr, ElapsedMs, Success(bool)

- IPortChecker（可选抽象，便于单元测试）
  - 方法：`Task<bool> IsPortOpenAsync(string host, int port, int timeoutMs)`

错误处理和鲁棒性
- 并发保护：使用 `SemaphoreSlim` 确保上一次任务完成前不重复执行重启逻辑。
- 命令超时：命令执行应有整体超时，超时按失败处理并记录 stderr/超时信息。
- 重试：按配置的 `MaxRetries` 与 `RetryBackoffSeconds` 进行简单重试。
- 日志：使用 Serilog 记录事件，包括检测结果、命令输出、失败次数与时间戳。
- 告警扩展点：当连续失败达到阈值时，写入专门日志或调用 Webhook（留作后续扩展）。

安全与权限
- 执行命令的 Windows Service 账户必须对要执行的脚本或可执行文件有权限。
- 配置中的命令路径和参数应由运维管理，不在代码中硬编码敏感凭据。

测试计划
- 单元测试：为 `ICommandExecutor`、`IPortChecker` 编写单元测试（使用 Mock 模拟成功/失败/超时）。
- 集成测试：手动或脚本停止目标程序，观察服务在下一个周期是否调用命令并成功重启；验证日志条目。

部署与回滚
- 将新服务作为代码变更随同 Issuer Server 一并部署（不需额外服务）。
- 若发现问题，可回滚代码或在 `appsettings.json` 中将 `PortMonitor:Enabled` 设为 `false` 即停用。

代码改动清单（预计）
- 新增文件：
  - `server/Services/PortMonitorService.cs`
  - `server/Services/CommandExecutor.cs`（实现 `ICommandExecutor`）
  - `server/Models/PortMonitorOptions.cs`
- 修改：
  - `server/Program.cs`：注册配置 `builder.Services.Configure<PortMonitorOptions>(...)` 与 `builder.Services.AddHostedService<PortMonitorService>()`。
  - `server/appsettings.json`：加入 `PortMonitor` 配置段。

后续工作（实现阶段）
1. 基于本设计实现代码并添加单元测试。
2. 在测试环境部署并进行集成测试（停止目标程序验证自恢复）。
3. 如需要，添加告警（Webhook/邮件/钉钉）与更多监控指标。

审查者任务
- 请从兼容性、权限、安全（命令注入风险）、可观测性（日志/指标）、以及与现有代码风格一致性等角度审查此文档。
