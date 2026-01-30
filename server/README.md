# Excellence Issuer Server

Node.js + Hono.js API server with Mercurial integration.

## Installation

```bash
cd D:\excellence.wh\projects\issuer\server
npm install
```

## Development

```bash
npm run dev    # Development with hot reload (tsx watch)
```

Open http://localhost:3001

## Production Deployment (PM2)

### Quick Deploy (推荐)

```bash
# 仅构建并重启（不拉取代码）
npm run deploy

# 拉取最新代码 + 构建 + 重启
npm run deploy:pull
```

### Manual Steps

```bash
# 1. Build
npm run build

# 2. Start with PM2
pm2 start dist/server.js --name excellence-server

# 3. Enable auto-start (Windows)
pm2 save
npm run windows:setup-autostart  # Requires Administrator
```

### PM2 Commands
```bash
pm2 start excellence-server      # Start
pm2 stop excellence-server       # Stop
pm2 restart excellence-server    # Restart
pm2 logs excellence-server       # View logs
pm2 monit                        # Monitor
pm2 delete excellence-server     # Remove
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development mode with hot reload |
| `npm start` | Run directly with tsx |
| `npm run build` | Build to dist/server.js |
| `npm run deploy` | Deploy with PM2 (build + restart) |
| `npm run deploy:pull` | Pull code + deploy |
| `npm run windows:setup-autostart` | Setup Windows auto-start |
| `npm test` | Run tests |

## API Documentation

Open http://localhost:3001/docs after starting the server.
