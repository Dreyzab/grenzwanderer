# index-profiles.ps1 - OpenViking Indexing Script

param(
    [Alias("ProfileName")]
    [string]$TargetProfile = "default"
)

$scriptDir = $PSScriptRoot
$repoRoot = (Get-Item $scriptDir).Parent.Parent.FullName
$workspaceRoot = Split-Path $repoRoot -Parent
$projectDir = $repoRoot

# Resolve the OpenViking venv with the SAME order and marker as start-mcp.ps1
# (prefer scripts/openviking/.venv, then repo ov_venv, then workspace ov_venv),
# keyed off openviking-server.exe. This guarantees the indexing CLI (ov.exe)
# comes from the exact same venv as the running server, so the two cannot drift
# in version. Keep this candidate list in sync with start-mcp.ps1.
$venvCandidates = @(
    (Join-Path $scriptDir ".venv"),
    (Join-Path $repoRoot "ov_venv"),
    (Join-Path $workspaceRoot "ov_venv")
)
$ovVenv = $null
foreach ($candidate in $venvCandidates) {
    if (Test-Path (Join-Path $candidate "Scripts\openviking-server.exe")) {
        $ovVenv = (Get-Item $candidate).FullName
        break
    }
}
if (-not $ovVenv) {
    throw "OpenViking venv not found (no Scripts\openviking-server.exe). Checked: $($venvCandidates -join '; ')"
}
$ovExe = Join-Path $ovVenv "Scripts\ov.exe"
if (-not (Test-Path $ovExe)) {
    throw "OpenViking CLI not found at '$ovExe'. The resolved venv ('$ovVenv') has openviking-server.exe but no ov.exe."
}
$ovServerExe = Join-Path $ovVenv "Scripts\openviking-server.exe"
$ovPython = Join-Path $ovVenv "Scripts\python.exe"

# Coherence guard. NOTE: `ov.exe --version` is NOT reliable -- it prints a stale
# string (the CLI's __version__ lags the package), so it reports an older number
# than the actually-installed openviking package. ov.exe and openviking-server.exe
# are console scripts of the SAME single 'openviking' package, so the meaningful
# check is: does the authoritative installed package version match what the
# server binary runs? That catches a genuinely corrupt/half-upgraded venv
# without false-positiving on ov.exe's cosmetic version string.
function Get-OpenVikingServerVersion {
    param([string]$ExePath)

    $raw = (& $ExePath --version 2>$null | Out-String)
    if ($raw -match '\d+\.\d+\.\d+') {
        return $Matches[0]
    }
    return $null
}

$packageVersion = $null
if (Test-Path $ovPython) {
    $raw = (& $ovPython -c "import importlib.metadata as m; print(m.version('openviking'))" 2>$null | Out-String)
    if ($raw -match '\d+\.\d+\.\d+') {
        $packageVersion = $Matches[0]
    }
}
$serverVersion = Get-OpenVikingServerVersion -ExePath $ovServerExe
if (-not $packageVersion -or -not $serverVersion) {
    throw "Could not determine OpenViking versions in venv '$ovVenv' (package='$packageVersion', server='$serverVersion'). Reinstall the venv so the openviking package and openviking-server.exe both report a version."
}
if ($packageVersion -ne $serverVersion) {
    throw "OpenViking venv '$ovVenv' is incoherent: installed package is $packageVersion but openviking-server.exe runs $serverVersion. Repair the venv, e.g.: & '$ovVenv\Scripts\pip.exe' install --force-reinstall `"openviking==$packageVersion`""
}

$ignoreDirs = "node_modules,dist,.git,.runtime,.spacetime,.spacetime-local-3001,.logs"
$excludePatterns = "*.log,*.lock,*.mp3,*.wav,*.mp4,*.canvas"

function Get-ProfileTargets {
    param([string]$Profile)

    switch ($Profile.ToLowerInvariant()) {
        "core" {
            return @(
                (Join-Path $projectDir "src\shared"),
                (Join-Path $projectDir "src\entities"),
                (Join-Path $projectDir "ARCHITECTURE.md"),
                (Join-Path $projectDir "docs\INVARIANTS.md"),
                (Join-Path $projectDir "docs\DEVELOPMENT_ROADMAP.md")
            )
        }
        "rules" {
            return @(
                (Join-Path $projectDir "docs"),
                (Join-Path $projectDir "README.md"),
                (Join-Path $projectDir "ARCHITECTURE.md"),
                (Join-Path $projectDir "DOCS_POLICY.md")
            )
        }
        "backend" {
            return @(
                (Join-Path $projectDir "spacetimedb"),
                (Join-Path $projectDir "scripts"),
                (Join-Path $projectDir "src\module_bindings")
            )
        }
        "data" {
            return @(
                (Join-Path $projectDir "content"),
                (Join-Path $projectDir "public\content"),
                (Join-Path $projectDir "obsidian"),
                (Join-Path $projectDir "public\images")
            )
        }
        "runtime" {
            return @(
                (Join-Path $projectDir "content\vn"),
                (Join-Path $projectDir "public\content\vn"),
                (Join-Path $projectDir "scripts\extract-vn-content.ts"),
                (Join-Path $projectDir "scripts\data\case_01_points.ts"),
                (Join-Path $projectDir "scripts\data\case01_canon_runtime.ts"),
                (Join-Path $projectDir "obsidian\StoryDetective\40_GameViewer\Case01\_runtime"),
                (Join-Path $projectDir "src\features\vn"),
                (Join-Path $projectDir "src\features\map\data\scenario-mapping.ts"),
                (Join-Path $projectDir "src\features\map\data\generated-static-points.ts"),
                (Join-Path $projectDir "scripts\acceptance-matrix.ts")
            )
        }
        "case01" {
            return @(
                (Join-Path $projectDir "obsidian\StoryDetective\40_GameViewer\Case01"),
                (Join-Path $projectDir "scripts\data\case01_canon_runtime.ts"),
                (Join-Path $projectDir "scripts\data\case_01_points.ts"),
                (Join-Path $projectDir "content\vn\pilot.snapshot.json"),
                (Join-Path $projectDir "public\images")
            )
        }
        "design" {
            return @(
                (Join-Path $projectDir "obsidian\Detectiv\10_Narrative\Scenes"),
                (Join-Path $projectDir "obsidian\Detectiv\30_World_Intel\Characters"),
                (Join-Path $projectDir "obsidian\Detectiv\00_Map_Room\qst_lotte_wires.md"),
                (Join-Path $projectDir "obsidian\Detectiv\00_Map_Room\loc_ka_estate.md"),
                (Join-Path $projectDir "docs\CASE01_CANON_IDENTITY.md")
            )
        }
        "roadmap" {
            return @(
                (Join-Path $projectDir "docs\DEVELOPMENT_ROADMAP.md"),
                (Join-Path $projectDir "docs\ACCEPTANCE_MATRIX.md"),
                (Join-Path $projectDir "docs\OPENVIKING_CASE01_AUDIT.md"),
                (Join-Path $projectDir "ARCHITECTURE.md"),
                (Join-Path $projectDir "README.md")
            )
        }
        "frontend" {
            return @(
                (Join-Path $projectDir "src\app"),
                (Join-Path $projectDir "src\pages"),
                (Join-Path $projectDir "src\widgets"),
                (Join-Path $projectDir "src\features"),
                (Join-Path $projectDir "src\assets"),
                (Join-Path $projectDir "index.html"),
                (Join-Path $projectDir "vite.config.ts")
            )
        }
        "pilot" {
            return @(
                (Join-Path $projectDir "src"),
                (Join-Path $projectDir "content\vn"),
                (Join-Path $projectDir "docs")
            )
        }
        default {
            return @(
                (Join-Path $projectDir "src"),
                (Join-Path $projectDir "docs"),
                (Join-Path $projectDir "content"),
                (Join-Path $projectDir "spacetimedb"),
                (Join-Path $projectDir "README.md"),
                (Join-Path $projectDir "ARCHITECTURE.md")
            )
        }
    }
}

Write-Host "Indexing profile: $TargetProfile"

& $ovExe health -o json | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "OpenViking is not healthy. Start the server before indexing."
}

$targets = Get-ProfileTargets -Profile $TargetProfile
$resolvedTargets = $targets | Where-Object { Test-Path $_ }

if (-not $resolvedTargets -or $resolvedTargets.Count -eq 0) {
    throw "No index targets resolved for profile '$TargetProfile'."
}

foreach ($target in $resolvedTargets) {
    Write-Host "Adding resource: $target"
    & $ovExe add-resource $target --wait --reason "profile:$TargetProfile" --ignore-dirs $ignoreDirs --exclude $excludePatterns
    if ($LASTEXITCODE -ne 0) {
        throw "Indexing failed for target: $target"
    }
}

Write-Host "Indexing completed."
