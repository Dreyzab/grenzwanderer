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

function Import-DotEnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    foreach ($line in Get-Content $Path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("#")) {
            continue
        }

        $separatorIndex = $trimmed.IndexOf("=")
        if ($separatorIndex -lt 1) {
            continue
        }

        $name = $trimmed.Substring(0, $separatorIndex).Trim()
        $value = $trimmed.Substring($separatorIndex + 1)

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        if ([string]::IsNullOrWhiteSpace($name)) {
            continue
        }

        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name, "Process"))) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Get-OpenVikingApiKey {
    $candidates = @(
        $env:OPENVIKING_GOOGLE_API_KEY,
        $env:GOOGLE_API_KEY,
        $env:GEMINI_API_KEY
    )

    foreach ($candidate in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate)) {
            return $candidate.Trim()
        }
    }

    return $null
}

function Get-OpenVikingConfigSourcePath {
    param(
        [string]$PrimaryPath,
        [string]$FallbackPath
    )

    if (Test-Path $PrimaryPath) {
        return $PrimaryPath
    }

    if (Test-Path $FallbackPath) {
        return $FallbackPath
    }

    throw "OpenViking config not found. Expected either '$PrimaryPath' or '$FallbackPath'."
}

function Resolve-ExistingPath {
    param(
        [string[]]$CandidatePaths,
        [string]$Description
    )

    foreach ($candidate in $CandidatePaths) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            return (Get-Item $candidate).FullName
        }
    }

    $joinedCandidates = $CandidatePaths -join "', '"
    throw "Unable to resolve $Description. Checked: '$joinedCandidates'."
}

function Resolve-OpenVikingRuntimeConfig {
    param(
        [string]$SourcePath,
        [string]$WorkspacePath,
        [string]$TargetPath,
        [string]$ApiKey
    )

    $config = Get-Content $SourcePath -Raw | ConvertFrom-Json

    if (-not $config.storage) {
        throw "Invalid OpenViking config: missing storage section."
    }

    $resolvedWorkspace = [System.IO.Path]::GetFullPath($WorkspacePath)
    $config.storage.workspace = $resolvedWorkspace

    $apiKeyTargets = @(
        @{ Label = "embedding.dense"; Node = $config.embedding.dense },
        @{ Label = "vlm"; Node = $config.vlm },
        @{ Label = "bot.agents"; Node = $config.bot.agents }
    )
    $missingApiKeyTargets = New-Object System.Collections.Generic.List[string]

    foreach ($target in $apiKeyTargets) {
        if ($null -eq $target.Node) {
            continue
        }

        if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
            $target.Node.api_key = $ApiKey
        }

        if ([string]::IsNullOrWhiteSpace([string]$target.Node.api_key)) {
            $missingApiKeyTargets.Add($target.Label)
        }
    }

    if ($missingApiKeyTargets.Count -gt 0) {
        $missingLabels = ($missingApiKeyTargets | Sort-Object) -join ", "
        throw "Missing Google API key for OpenViking config sections: $missingLabels. Set OPENVIKING_GOOGLE_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY in your shell or in repo .env/.env.local."
    }

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
$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$workspaceRoot = Split-Path $repoRoot -Parent
$serverExe = Resolve-ExistingPath -Description "OpenViking server executable" -CandidatePaths @(
    (Join-Path $PSScriptRoot ".venv\Scripts\openviking-server.exe"),
    (Join-Path $repoRoot "ov_venv\Scripts\openviking-server.exe"),
    (Join-Path $workspaceRoot "ov_venv\Scripts\openviking-server.exe")
)
$ovConf = Join-Path $PSScriptRoot "ov.conf"
$ovConfExample = Join-Path $PSScriptRoot "ov.conf.example"
$runtimeConf = Join-Path $PSScriptRoot "ov.runtime.conf"
$workspaceDir = Resolve-ExistingPath -Description "OpenViking workspace directory" -CandidatePaths @(
    (Join-Path $repoRoot "data"),
    (Join-Path $workspaceRoot "data")
)
$log = Join-Path $PSScriptRoot "server.stdout.log"
$errLog = Join-Path $PSScriptRoot "server.stderr.log"

Import-DotEnvFile -Path (Join-Path $repoRoot ".env")
Import-DotEnvFile -Path (Join-Path $repoRoot ".env.local")
$apiKey = Get-OpenVikingApiKey

# Custom injection for Google Service Account (OAuth2)
if ($env:OPENVIKING_GOOGLE_CREDENTIALS -and (Test-Path $env:OPENVIKING_GOOGLE_CREDENTIALS)) {
    Write-TransportInfo "Generating Google OAuth token from Service Account..."
    $pythonExe = Join-Path (Split-Path $serverExe -Parent) "python.exe"
    $tokenScript = Join-Path $PSScriptRoot "get_google_token.py"
    
    # Run the script and capture output
    $tokenOutput = & $pythonExe $tokenScript $env:OPENVIKING_GOOGLE_CREDENTIALS
    if ($LASTEXITCODE -eq 0 -and $tokenOutput.StartsWith("ya29.")) {
        $apiKey = $tokenOutput.Trim()
        Write-TransportInfo "Success: Using OAuth2 Access Token for Google APIs."
    } else {
        Write-Warning "Failed to generate OAuth token ($tokenOutput). Falling back to standard API key."
    }
}

$configSource = Get-OpenVikingConfigSourcePath -PrimaryPath $ovConf -FallbackPath $ovConfExample

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
        $resolvedConfig = Resolve-OpenVikingRuntimeConfig -SourcePath $configSource -WorkspacePath $workspaceDir -TargetPath $runtimeConf -ApiKey $apiKey
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
