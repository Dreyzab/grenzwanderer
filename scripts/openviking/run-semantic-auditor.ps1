# Запуск semantic_auditor_case01.py через Python из ov_venv (есть openviking_cli).
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PassArgs
)

$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$py = Join-Path $repoRoot "ov_venv\Scripts\python.exe"
$auditor = Join-Path $PSScriptRoot "semantic_auditor_case01.py"

if (-not (Test-Path $py)) {
    throw "Python venv not found: $py"
}
if (-not (Test-Path $auditor)) {
    throw "Auditor script not found: $auditor"
}

& $py $auditor @PassArgs
exit $LASTEXITCODE
