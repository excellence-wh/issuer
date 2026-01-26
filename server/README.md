To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3001

## Windows Service Deployment

### Install as Windows Service
1. Run PowerShell as Administrator
2. Execute the installation script:
```powershell
cd D:\excellence.wh\projects\issuer\server
.\scripts\install-service.ps1
```

### Service Management
```powershell
# Start service
Start-Service ExcellenceIssuerServer

# Stop service
Stop-Service ExcellenceIssuerServer

# Check status
Get-Service ExcellenceIssuerServer

# View logs
Get-Content "D:\excellence.wh\projects\issuer\server\logs\service.log" -Wait
```

### Uninstall Service
```powershell
cd D:\excellence.wh\projects\issuer\server
.\scripts\uninstall-service.ps1
```

### Service Configuration
- Service Name: ExcellenceIssuerServer
- Port: 3001
- Working Directory: D:\excellence.wh\projects\issuer\server
- Startup Type: Automatic (starts with Windows)
- Logs Location: D:\excellence.wh\projects\issuer\server\logs\