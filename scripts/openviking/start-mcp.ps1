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

function Write-TransportWarning {
    param([string]$Message)

    if ($Transport -eq "stdio") {
        [Console]::Error.WriteLine("WARNING: $Message")
        return
    }

    Write-Warning $Message
}

function Test-IsPlaceholderSecret {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }

    $normalized = $Value.Trim()
    return $normalized -match '^(?i)(your_|example|replace_|changeme|dummy|test_|set-via-)' `
        -or $normalized -match '(?i)(api_key_here|token_here|example_key|actual_token|placeholder|will_be_injected|injected_at_startup)' `
        -or ($normalized.StartsWith("<") -and $normalized.EndsWith(">"))
}

function Resolve-ServiceAccountToken {
    $credentialsPath = $env:OPENVIKING_GOOGLE_CREDENTIALS
    if ([string]::IsNullOrWhiteSpace($credentialsPath)) {
        return $null
    }

    if (-not (Test-Path $credentialsPath)) {
        Write-TransportWarning "OPENVIKING_GOOGLE_CREDENTIALS is set ('$credentialsPath') but the file was not found."
        return $null
    }

    $env:GOOGLE_APPLICATION_CREDENTIALS = $credentialsPath

    $tokenScript = Join-Path $PSScriptRoot "get_google_token.py"
    if (-not (Test-Path $tokenScript)) {
        Write-TransportWarning "Token generation script not found at '$tokenScript'."
        return $null
    }

    $repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
    $workspaceRoot = Split-Path $repoRoot -Parent
    
    $pythonCandidates = @(
        (Join-Path $PSScriptRoot ".venv\Scripts\python.exe"),
        (Join-Path $repoRoot "ov_venv\Scripts\python.exe"),
        (Join-Path $workspaceRoot "ov_venv\Scripts\python.exe")
    )

    $pythonExe = $null
    foreach ($candidate in $pythonCandidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            $pythonExe = (Get-Item $candidate).FullName
            break
        }
    }

    if ($null -eq $pythonExe) {
        Write-TransportWarning "Could not find Python executable for token generation."
        return $null
    }

    try {
        Write-TransportInfo "Generating OAuth2 token from Google Service Account ('$credentialsPath')..."
        $token = & $pythonExe $tokenScript $credentialsPath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-TransportWarning "Failed to generate token: $token"
            return $null
        }
        return $token.Trim()
    } catch {
        Write-TransportWarning "Error running token generation script: $_"
        return $null
    }
}

function Resolve-OpenVikingApiKey {
    $placeholderSources = New-Object System.Collections.Generic.List[string]

    $token = Resolve-ServiceAccountToken
    if ($null -ne $token) {
        return [PSCustomObject]@{
            Value = $token
            Source = "OPENVIKING_GOOGLE_CREDENTIALS"
            Checked = @("OPENVIKING_GOOGLE_CREDENTIALS")
            PlaceholderSources = @($placeholderSources)
        }
    }

    $candidates = @(
        [PSCustomObject]@{ Name = "OPENVIKING_GOOGLE_API_KEY"; Value = $env:OPENVIKING_GOOGLE_API_KEY },
        [PSCustomObject]@{ Name = "GOOGLE_API_KEY"; Value = $env:GOOGLE_API_KEY },
        [PSCustomObject]@{ Name = "GEMINI_API_KEY"; Value = $env:GEMINI_API_KEY }
    )

    foreach ($candidate in $candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate.Value)) {
            continue
        }

        $trimmedValue = $candidate.Value.Trim()
        if (Test-IsPlaceholderSecret -Value $trimmedValue) {
            $placeholderSources.Add($candidate.Name)
            continue
        }

        return [PSCustomObject]@{
            Value = $trimmedValue
            Source = $candidate.Name
            Checked = @($candidates.Name)
            PlaceholderSources = @($placeholderSources)
        }
    }

    return [PSCustomObject]@{
        Value = $null
        Source = $null
        Checked = @($candidates.Name)
        PlaceholderSources = @($placeholderSources)
    }
}

function Assert-OpenVikingApiKey {
    param([PSCustomObject]$Resolution)

    $checkedVars = $Resolution.Checked -join ", "
    if (-not [string]::IsNullOrWhiteSpace($Resolution.Value)) {
        return $Resolution.Value
    }

    if ($Resolution.PlaceholderSources.Count -gt 0) {
        $placeholderVars = $Resolution.PlaceholderSources -join ", "
        throw "Missing API key or Service Account for OpenViking. Placeholder-like values were found in: $placeholderVars. Checked env vars: $checkedVars. Set OPENVIKING_GOOGLE_CREDENTIALS to a service account JSON, or use OPENVIKING_GOOGLE_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY."
    }

    throw "Missing API key or Service Account for OpenViking. Checked env vars: $checkedVars. Set OPENVIKING_GOOGLE_CREDENTIALS to a service account JSON, or use OPENVIKING_GOOGLE_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY."
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
        throw "Missing Gemini API key for OpenViking config sections: $missingLabels. Set OPENVIKING_GOOGLE_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY in your shell or in repo .env/.env.local."
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

function Get-OpenVikingRequestHeaders {
    $headers = @{
        "Accept" = "application/json"
        "Content-Type" = "application/json"
    }

    if (-not [string]::IsNullOrWhiteSpace($env:OPENVIKING_API_KEY)) {
        $headers["X-API-Key"] = $env:OPENVIKING_API_KEY.Trim()
    }

    return $headers
}

function Get-OpenVikingErrorDetails {
    param([System.Management.Automation.ErrorRecord]$ErrorRecord)

    if ($null -eq $ErrorRecord) {
        return $null
    }

    if ($ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
        return $ErrorRecord.ErrorDetails.Message
    }

    if ($ErrorRecord.Exception -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.Exception.Message)) {
        return $ErrorRecord.Exception.Message
    }

    return $ErrorRecord.ToString()
}

function Test-OpenVikingSemanticSearch {
    param(
        [string]$Url = "http://127.0.0.1:1933",
        [string]$Query = "OpenViking semantic auth smoke test",
        [int]$Limit = 3,
        [int]$TimeoutSeconds = 30
    )

    $payload = @{
        query = $Query
        limit = $Limit
    } | ConvertTo-Json -Depth 8 -Compress

    try {
        $response = Invoke-WebRequest `
            -UseBasicParsing `
            -Method Post `
            -Uri "$Url/api/v1/search/find" `
            -Headers (Get-OpenVikingRequestHeaders) `
            -TimeoutSec $TimeoutSeconds `
            -Body $payload
    } catch {
        $details = Get-OpenVikingErrorDetails -ErrorRecord $_
        throw "OpenViking semantic smoke failed: $details"
    }

    if ($response.StatusCode -ne 200) {
        throw "OpenViking semantic smoke failed with unexpected HTTP status $($response.StatusCode): $($response.Content)"
    }

    try {
        $parsed = $response.Content | ConvertFrom-Json
    } catch {
        throw "OpenViking semantic smoke returned a non-JSON response: $($response.Content)"
    }

    if ($null -eq $parsed -or -not ($parsed.PSObject.Properties.Name -contains "result")) {
        throw "OpenViking semantic smoke response did not include a result object: $($response.Content)"
    }

    $matchCount = 0
    foreach ($bucketName in @("resources", "skills", "memories")) {
        if ($parsed.result.PSObject.Properties.Name -contains $bucketName) {
            $bucket = $parsed.result.$bucketName
            if ($null -ne $bucket) {
                $matchCount += @($bucket).Count
            }
        }
    }

    Write-TransportInfo "OpenViking semantic smoke passed at $Url (query='$Query', matches=$matchCount)"
    return $true
}

function Stop-StaleOpenVikingProcesses {
    param([string]$ServerPath)

    $serverProcesses = Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "openviking-server" -and $_.Path -eq $ServerPath
    }

    foreach ($process in $serverProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        } catch {
            Write-TransportWarning "Failed to stop stale OpenViking process $($process.Id): $_"
        }
    }
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

$configSource = Get-OpenVikingConfigSourcePath -PrimaryPath $ovConf -FallbackPath $ovConfExample

# 1. Check if server is running
$isRunning = $false
$portCheck = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object {
    $_.State -eq "Listen"
}
if ($portCheck) {
    $isRunning = $true
    try {
        [void](Test-OpenVikingHealth -Url "http://127.0.0.1:$port" -TimeoutSeconds 2)
    } catch {
        $isRunning = $false
    }
}

if (-not $isRunning) {
    Stop-StaleOpenVikingProcesses -ServerPath $serverExe
}

# 2. Start the server if not running
if (-not $isRunning) {
    Write-TransportInfo "Starting OpenViking Server in background..."
    try {
        $apiKeyResolution = Resolve-OpenVikingApiKey
        $apiKey = Assert-OpenVikingApiKey -Resolution $apiKeyResolution
        $resolvedConfig = Resolve-OpenVikingRuntimeConfig -SourcePath $configSource -WorkspacePath $workspaceDir -TargetPath $runtimeConf -ApiKey $apiKey
        Start-Process -FilePath $serverExe -ArgumentList "--config `"$resolvedConfig`" --with-bot" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errLog
        [void](Test-OpenVikingHealth -Url "http://127.0.0.1:$port" -TimeoutSeconds 30)
    } catch {
        throw "Failed to start server: $_"
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
        throw "MCP Bridge script not found: $bridgeScript"
    }
} else {
    Write-TransportInfo "OpenViking server is ready at http://127.0.0.1:$port"
}
