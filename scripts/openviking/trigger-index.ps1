$ovExe = "f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\.venv\Scripts\ov.exe"
$ovConf = "f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\ov.runtime.conf"

$targets = @(
    "f:\proje\grenzwanderer\Grenzwanderer\docs\DEVELOPMENT_ROADMAP.md",
    "f:\proje\grenzwanderer\Grenzwanderer\ARCHITECTURE.md",
    "f:\proje\grenzwanderer\Grenzwanderer\README.md"
)

foreach ($target in $targets) {
    Write-Host "Re-indexing: $target"
    & $ovExe --config $ovConf add-resource $target --wait --reason "Antigravity manual re-index"
}
