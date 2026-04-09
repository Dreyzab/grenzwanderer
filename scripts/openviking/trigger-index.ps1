$ovExe = "f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\.venv\Scripts\ov.exe"
$ovConf = "f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\ov.runtime.conf"

$targets = @(
    "f:\proje\grenzwanderer\Grenzwanderer\src",
    "f:\proje\grenzwanderer\Grenzwanderer\docs",
    "f:\proje\grenzwanderer\Grenzwanderer\ARCHITECTURE.md",
    "f:\proje\grenzwanderer\Grenzwanderer\README.md",
    "f:\proje\grenzwanderer\Grenzwanderer\AGENTS.md"
)

foreach ($target in $targets) {
    Write-Host "Re-indexing: $target"
    & $ovExe add-resource $target --wait --reason "re-index"
}
