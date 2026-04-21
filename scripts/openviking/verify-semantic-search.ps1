# verify-semantic-search.ps1 - OpenViking semantic smoke test

param(
    [string]$Url = "http://127.0.0.1:1933",
    [string]$Query = "OpenViking semantic auth smoke test",
    [int]$Limit = 3
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "start-mcp.ps1")
[void](Test-OpenVikingSemanticSearch -Url $Url -Query $Query -Limit $Limit)
