param(
    [switch]$PreserveDb
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Wait-ForLocalSpacetime([int]$TimeoutSeconds = 45) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-NetConnection -ComputerName "127.0.0.1" -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

Assert-Command "bun"
Assert-Command "spacetime"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    & bun install
}

$logsDir = Join-Path $projectRoot ".logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$startedSpacetime = $false
$spacetimeProcess = $null
$localServerRunning = Test-NetConnection -ComputerName "127.0.0.1" -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $localServerRunning) {
    Write-Host "Starting local SpacetimeDB on port 3001..."

    $stdoutLog = Join-Path $logsDir "spacetime-start.out.log"
    $stderrLog = Join-Path $logsDir "spacetime-start.err.log"

    $spacetimeProcess = Start-Process `
        -FilePath "spacetime" `
        -ArgumentList "start --listen-addr 127.0.0.1:3001" `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -PassThru

    $startedSpacetime = $true

    if (-not (Wait-ForLocalSpacetime -TimeoutSeconds 45)) {
        $errorDetails = ""
        if (Test-Path $stderrLog) {
            $errorDetails = Get-Content -Raw $stderrLog
        }
        throw "Local SpacetimeDB did not become ready on 127.0.0.1:3001. $errorDetails"
    }

    Write-Host "Local SpacetimeDB is ready on port 3001."
    Write-Host "Logs: $stdoutLog"
}
else {
    Write-Host "Local SpacetimeDB is already running on 127.0.0.1:3001."
}

try {
    if ($PreserveDb) {
        Write-Host "Publishing local module without clearing database..."
        & bun run spacetime:publish:local
    }
    else {
        Write-Host "Publishing local module and clearing database..."
        & bun run spacetime:publish:local:clear
    }

    Write-Host "Generating TypeScript bindings..."
    & bun run spacetime:generate

    if (-not $PreserveDb) {
        Write-Host "Extracting and releasing narrative content (re-seeding)..."
        & bun run content:extract
        & bun run scripts/content-release.ts --version 0.1.0 --host http://127.0.0.1:3001 --db grezwandererdata
    }

    Write-Host "Starting frontend dev server on port 5174 with --force..."
    & bun run dev -- --port 5174 --force
}
finally {
    if ($startedSpacetime -and $spacetimeProcess -and -not $spacetimeProcess.HasExited) {
        Write-Host "Stopping local SpacetimeDB started by this script..."
        Stop-Process -Id $spacetimeProcess.Id -Force
    }
}
