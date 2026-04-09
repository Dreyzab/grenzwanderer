param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PassArgs
)

function Convert-ToPythonCliArgs {
    param([string[]]$ArgsList)

    $mapping = @{
        "-BaseUrl" = "--base-url"
        "-ProjectDir" = "--project-dir"
        "-NodeLimit" = "--node-limit"
        "-MaxFiles" = "--max-files"
        "-StoryDetectivePlotOnly" = "--storydetective-plot-only"
        "-FindOnly" = "--find-only"
        "-DryRun" = "--dry-run"
        "-Timeout" = "--timeout"
        "-Out" = "--out"
    }

    $normalized = @()
    $iterableArgs = @()
    if ($null -ne $ArgsList) {
        $iterableArgs = @($ArgsList)
    }

    foreach ($arg in $iterableArgs) {
        if ($mapping.ContainsKey($arg)) {
            $normalized += $mapping[$arg]
        } else {
            $normalized += $arg
        }
    }

    return $normalized
}

$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$venvPython = Join-Path $repoRoot "ov_venv\Scripts\python.exe"
$auditor = Join-Path $PSScriptRoot "semantic_auditor_case01.py"

if (-not (Test-Path $auditor)) {
    throw "Auditor script not found: $auditor"
}

. (Join-Path $PSScriptRoot "start-mcp.ps1")
[void](Test-OpenVikingHealth -Url "http://127.0.0.1:1933" -TimeoutSeconds 30)

$pythonCommand = $null
if (Test-Path $venvPython) {
    $pythonCommand = @($venvPython)
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCommand = @("py", "-3")
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = @("python")
} else {
    throw "Python interpreter not found. Install Python or create ov_venv."
}

$pythonArgs = @()
if ($pythonCommand.Length -gt 1) {
    $pythonArgs = @($pythonCommand[1..($pythonCommand.Length - 1)])
}

$forwardedArgs = Convert-ToPythonCliArgs -ArgsList $PassArgs

& $pythonCommand[0] @pythonArgs $auditor @forwardedArgs
exit $LASTEXITCODE
