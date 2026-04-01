# start-mcp.ps1 - OpenViking Startup Script
# Created by Antigravity to restore auto-start functionality.

param (
    [string]$Transport = "http"
)

$port = 1933

function Write-TransportInfo {
    param([string]$Message)

    if ($Transport -ne "stdio") {
        Write-Host $Message
    }
}

function Resolve-OpenVikingRuntimeConfig {
    param(
        [string]$SourcePath,
        [string]$WorkspacePath,
        [string]$TargetPath
    )

    $config = Get-Content $SourcePath -Raw | ConvertFrom-Json

    if (-not $config.storage) {
        throw "Invalid OpenViking config: missing storage section."
    }

    $resolvedWorkspace = [System.IO.Path]::GetFullPath($WorkspacePath)
    $config.storage.workspace = $resolvedWorkspace

    $json = $config | ConvertTo-Json -Depth 32
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($TargetPath, $json, $utf8NoBom)
    return $TargetPath
}

function Test-OpenVikingHealth {
    param(
        [string]$Url = "http://127.0.0.1:1933",
        [int]$TimeoutSeconds = 10
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing "$Url/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                $payload = $response.Content | ConvertFrom-Json
                if ($payload.status -eq "ok" -or $payload.healthy -eq $true) {
                    Write-TransportInfo "OpenViking health check passed at $Url"
                    return $true
                }
            }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)

    throw "OpenViking health check failed for $Url"
}

# Root paths
$rootDir = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$ovVenv = Join-Path $rootDir "ov_venv"
$serverExe = Join-Path $ovVenv "Scripts\openviking-server.exe"
$ovConf = Join-Path $PSScriptRoot "ov.conf"
$runtimeConf = Join-Path $PSScriptRoot "ov.runtime.conf"
$workspaceDir = Join-Path $rootDir "data"
$log = Join-Path $PSScriptRoot "server.stdout.log"
$errLog = Join-Path $PSScriptRoot "server.stderr.log"

# 1. Check if server is running
$isRunning = $false
$portCheck = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portCheck) {
    $isRunning = $true
} else {
    $existing = Get-Process | Where-Object { $_.Path -like "*openviking-server*" } -ErrorAction SilentlyContinue
    if ($existing) { $isRunning = $true }
}

# 2. Start the server if not running
if (-not $isRunning) {
    Write-TransportInfo "Starting OpenViking Server in background..."
    try {
        $resolvedConfig = Resolve-OpenVikingRuntimeConfig -SourcePath $ovConf -WorkspacePath $workspaceDir -TargetPath $runtimeConf
        Start-Process -FilePath $serverExe -ArgumentList "--config `"$resolvedConfig`"" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errLog
        Start-Sleep -Seconds 2 # Wait for boot
    } catch {
        Write-Error "Failed to start server: $_"
        exit 1
    }
}

# 3. Handle Transport
if ($Transport -eq "stdio") {
    # Start the MCP bridge (Node.js/Bun) to provide tools over stdio
    # We use Bun as it's already in the project ecosystem
    $bridgeScript = Join-Path $PSScriptRoot "mcp_bridge.js"
    if (Test-Path $bridgeScript) {
        & bun run $bridgeScript
    } else {
        Write-Error "MCP Bridge script not found: $bridgeScript"
        exit 1
    }
} else {
    Write-TransportInfo "OpenViking server is ready at http://127.0.0.1:$port"
}
