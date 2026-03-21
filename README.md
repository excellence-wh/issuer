# Excellence Issuer

一个用于 Redmine 的浏览器扩展，提供 Issue 报告生成、周报生成和 Mercurial 集成功能。

## 功能特性

- **Issue 报告生成**：自动生成标准化的 Issue 报告
- **周报生成**：基于项目活动自动生成周报
- **Mercurial 集成**：查看和管理代码变更
- **MiMo AI 集成**：使用 AI 辅助生成报告内容
- **深色/浅色主题**：支持主题切换
- **本地开发支持**：可在 localhost:5173 进行开发测试

## 项目结构

```
excellence-issuer/
├── browser-extension/     # 浏览器扩展 (React + TypeScript)
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── services/      # API 服务
│   │   ├── utils/         # 工具函数
│   │   └── types/         # 类型定义
│   └── public/            # 静态资源
└── server/                # API 服务器 (Hono.js)
    ├── src/
    │   ├── routes/        # API 路由
    │   ├── services/      # 业务逻辑
    │   └── types/         # 类型定义
    └── scripts/           # 部署脚本
```

## 技术栈

### 浏览器扩展
- React 19
- TypeScript
- Vite
- Tailwind CSS
- @base-ui/react (UI 组件)
- Sonner (Toast 通知)
- Lucide Icons

### 服务器
- Bun 运行时
- Hono.js 框架
- Scalar (API 文档)

## 快速开始

### 前置要求
- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18
- Chrome/Edge 浏览器

### 安装依赖

```bash
# 安装服务器依赖
cd server
bun install

# 安装浏览器扩展依赖
cd ../browser-extension
bun install
```

### 开发模式

#### 启动服务器
```bash
cd server
bun run dev
```

#### 启动浏览器扩展开发服务器
```bash
cd browser-extension
bun run dev
```

开发服务器启动后，访问 http://localhost:5173/ 可以看到悬浮球。

### 构建

#### 构建服务器
```bash
cd server
bun run build
```

#### 构建浏览器扩展
```bash
cd browser-extension
bun run build
```

构建后的扩展文件在 `browser-extension/dist` 目录。

### 安装浏览器扩展

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions/` 或 `edge://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `browser-extension/dist` 目录

## 使用说明

### 基本使用

1. 安装扩展后，访问 Redmine 网站
2. 页面右下角会出现悬浮球
3. 点击悬浮球打开菜单
4. 选择需要的功能：
   - **Issue 报告**：生成当前 Issue 的报告
   - **周报**：生成项目周报
   - **设置**：配置扩展选项

### 主题切换

点击悬浮球菜单中的主题切换按钮，可以在深色和浅色主题之间切换。

### 本地开发测试

在开发模式下，访问 http://localhost:5173/ 即可看到悬浮球，方便开发和测试。

## API 服务器

服务器提供以下 API 端点：

- `/api/hg` - Mercurial 相关操作
- `/api/redmine` - Redmine 数据获取
- `/api/mimo` - MiMo AI 服务

详细的 API 文档可在服务器启动后访问 `/scalar` 查看。

## 配置

### 服务器配置

编辑 `server/appsettings.json`：

```json
{
  "Redmine": {
    "BaseUrl": "https://your-redmine-instance.com",
    "ApiKey": "your-api-key"
  },
  "MiMo": {
    "BaseUrl": "https://api.xiaomimimo.com",
    "ApiKey": "your-api-key"
  }
}
```

### 浏览器扩展配置

通过扩展的设置界面进行配置，包括：
- 语言设置（中文/英文）
- 主题设置（深色/浅色）

## 开发指南

### 代码规范

运行 lint 检查：
```bash
cd browser-extension
bun run lint
```

### 项目约定

- 使用 TypeScript 严格模式
- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名
- 使用 Sonner 进行 Toast 通知
- UI 组件基于 @base-ui/react

## 部署

### 服务器部署

使用提供的部署脚本：

```bash
cd server/scripts
.\deploy.bat
```

### 扩展发布

1. 更新 `manifest.json` 中的版本号
2. 构建扩展：`bun run build`
3. 打包 `dist` 目录为 zip 文件
4. 上传到 Chrome Web Store 或 Edge Add-ons

## 常见问题

### 悬浮球不显示
- 确认在 Redmine 网站或 localhost:5173 下访问
- 检查扩展是否正确安装和启用
- 查看浏览器控制台是否有错误信息

### API 请求失败
- 检查服务器是否正常运行
- 确认 API 配置是否正确
- 检查网络连接和防火墙设置

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](LICENSE)

## 联系方式

如有问题，请通过 GitHub Issues 反馈。
