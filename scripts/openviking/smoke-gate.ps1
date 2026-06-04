# smoke-gate.ps1 - local pre-push gate for the OpenViking Case01 smoke.
#
# Runs the Case01 retrieval smoke ONLY if the OpenViking server is already
# healthy. If the server is not running it skips (exit 0) so pushes are never
# blocked just because the local retrieval service happens to be stopped. When
# the server IS up, a smoke failure fails the gate (exit 1) and blocks the push.
#
# It intentionally does NOT start the server (no venv/API-key/index assumptions
# at push time); the health probe below is a plain HTTP GET, not start-mcp.ps1.

param(
    [string]$Url = "http://127.0.0.1:1933"
)

$ErrorActionPreference = "Stop"

$healthy = $false
try {
    $response = Invoke-WebRequest -UseBasicParsing "$Url/health" -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $payload = $response.Content | ConvertFrom-Json
        if ($payload.status -eq "ok" -or $payload.healthy -eq $true) {
            $healthy = $true
        }
    }
} catch {
    $healthy = $false
}

if (-not $healthy) {
    Write-Host "OpenViking not reachable at $Url - skipping Case01 smoke gate."
    exit 0
}

Write-Host "OpenViking healthy - running Case01 smoke gate..."
try {
    & (Join-Path $PSScriptRoot "smoke-case01.ps1") -Url $Url
    Write-Host "Case01 smoke gate passed."
    exit 0
} catch {
    Write-Host "Case01 smoke gate FAILED: $($_.Exception.Message)"
    exit 1
}
