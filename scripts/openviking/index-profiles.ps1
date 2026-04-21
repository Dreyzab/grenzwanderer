# index-profiles.ps1 - OpenViking Indexing Script

param(
    [Alias("ProfileName")]
    [string]$TargetProfile = "default"
)

$rootDir = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$projectDir = Join-Path $rootDir "Grenzwanderer"
$ovVenv = Join-Path $rootDir "ov_venv"
$ovExe = Join-Path $ovVenv "Scripts\ov.exe"
$ignoreDirs = "node_modules,dist,.git,.runtime,.spacetime,.spacetime-local-3001,.logs"
$excludePatterns = "*.log,*.lock,*.png,*.jpg,*.jpeg,*.gif,*.webp,*.mp3,*.wav,*.mp4"

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
                (Join-Path $projectDir "obsidian")
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
                (Join-Path $projectDir "content\vn\pilot.snapshot.json")
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
